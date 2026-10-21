"""Track the green phone screen in each frame and warp a screenshot into it."""
import glob, os, sys
import cv2
import numpy as np

src_dir, out_dir, shot_path = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
shot = cv2.imread(shot_path)
sh, sw = shot.shape[:2]
frames = sorted(glob.glob(f"{src_dir}/*.png"))

def green_mask(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (38, 60, 70), (88, 255, 255))
    return cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

def corners(mask):
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    hull = cv2.convexHull(max(cs, key=cv2.contourArea)).reshape(-1, 2).astype(np.float32)
    peri = cv2.arcLength(hull.reshape(-1, 1, 2), True)
    for eps in np.linspace(0.01, 0.1, 40):
        q = cv2.approxPolyDP(hull.reshape(-1, 1, 2), eps * peri, True)
        if len(q) == 4: break
    q = q.reshape(4, 2).astype(np.float32)
    s, d = q.sum(1), np.diff(q, axis=1).ravel()
    q = np.array([q[s.argmin()], q[d.argmin()], q[s.argmax()], q[d.argmax()]], np.float32)
    # Refine: densely sample the hull outline, fit a straight line to the middle
    # of each side (ignoring the rounded corners), then intersect neighbouring
    # lines. That puts the corners where the screen's straight edges would meet.
    # Use the raw outline (not the hull), so where the thumb crosses an edge its
    # points fall far from the line and get rejected.
    pts = max(cs, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)
    lines = []
    for i in range(4):
        a, b = q[i], q[(i + 1) % 4]
        ab = b - a
        L = np.linalg.norm(ab)
        t = ((pts - a) @ ab) / L ** 2
        dist = np.abs(ab[0] * (pts[:, 1] - a[1]) - ab[1] * (pts[:, 0] - a[0])) / L
        span = (t > 0.06) & (t < 0.94)
        if i == 0:  # top edge: skip the notch in the middle
            span &= (t < 0.27) | (t > 0.73)
        sel = pts[span & (dist < 10)]
        for _ in range(3):
            vx, vy, x0, y0 = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
            r = np.abs(vx * (sel[:, 1] - y0) - vy * (sel[:, 0] - x0))
            keep = r < max(1.5, np.percentile(r, 60))
            if keep.sum() < 20: break
            sel = sel[keep]
        lines.append((np.array([x0, y0]), np.array([vx, vy])))
    out = []
    for i in range(4):
        (p1, d1), (p2, d2) = lines[i - 1], lines[i]
        A = np.array([d1, -d2]).T
        t = np.linalg.solve(A, p2 - p1)
        out.append(p1 + d1 * t[0])
    return np.array(out, np.float32)

imgs = [cv2.imread(f) for f in frames]
masks = [green_mask(i) for i in imgs]
# Corners come from the ECC tracker (track_ecc.py): one clean reference
# fit carried through the clip by whole-screen alignment, so there is no
# per-frame jitter.
quads = np.load(sys.argv[4]) if len(sys.argv) > 4 else np.array([corners(m) for m in masks])

# Grow the quad slightly so the rounded screen corners are fully covered.
def grow(q, px=6):
    c = q.mean(0)
    return c + (q - c) * (1 + px / np.linalg.norm(q - c, axis=1, keepdims=True))

src = np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]])
for f, img, m, q in zip(frames, imgs, masks, quads):
    H = cv2.getPerspectiveTransform(src, grow(q, 9).astype(np.float32))
    warped = cv2.warpPerspective(shot, H, (img.shape[1], img.shape[0]), flags=cv2.INTER_AREA)
    # Soft matte from the key; despill green on the thumb edges.
    # Only key inside the tracked screen, so green plants behind stay untouched.
    region = np.zeros_like(m)
    cv2.fillConvexPoly(region, grow(q, 10).astype(np.int32), 255)
    m = cv2.bitwise_and(m, region)
    a = cv2.GaussianBlur(cv2.dilate(m, np.ones((7, 7), np.uint8)), (5, 5), 0).astype(np.float32)[..., None] / 255
    base = img.astype(np.float32)
    b, g, r = cv2.split(base)
    near = cv2.dilate(region, np.ones((15, 15), np.uint8)).astype(bool)
    g[near] = np.minimum(g, np.maximum(b, r) * 0.98)[near]
    base = cv2.merge([b, g, r])
    # Screens in this light read a touch dimmer and softer than a raw screenshot.
    scr = cv2.GaussianBlur(warped.astype(np.float32) * 0.9 + 8, (3, 3), 0)
    out = scr * a + base * (1 - a)
    cv2.imwrite(f"{out_dir}/{os.path.basename(f)}", np.clip(out, 0, 255).astype(np.uint8))
print("done", len(frames))
