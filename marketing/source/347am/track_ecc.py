"""Smooth screen track: align each frame's green matte to a reference with ECC homography."""
import glob, sys, cv2, numpy as np
exec(open('screen_replace.py').read().split('imgs = [')[0].replace('src_dir, out_dir, shot_path = sys.argv[1:4]', 'src_dir,out_dir,shot_path="s5in","/tmp/x","screen_final.png"'))
frames = sorted(glob.glob('s5in/*.png'))
masks = [green_mask(cv2.imread(f)) for f in frames]
raw = np.array([corners(m) for m in masks])
# Reference: the frame whose fit agrees best with its neighbours.
ref_i = int(np.argmin([np.abs(raw[i] - np.median(raw[max(0,i-5):i+6], 0)).sum() for i in range(len(raw))]))
ref_q = raw[ref_i]
def prep(m): return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 3)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
H = [None] * len(frames); H[ref_i] = np.eye(3, dtype=np.float32)
for rng in (range(ref_i + 1, len(frames)), range(ref_i - 1, -1, -1)):
    prev = ref_i
    for i in rng:
        w = H[prev].copy()
        try:
            _, w = cv2.findTransformECC(prep(masks[ref_i]), prep(masks[i]), w, cv2.MOTION_HOMOGRAPHY, crit, None, 5)
        except cv2.error:
            pass
        H[i] = w; prev = i
ecc = np.array([cv2.perspectiveTransform(ref_q[None], h)[0] for h in H])
def jitter(q): return float(np.abs(np.diff(q, 2, axis=0)).mean())
print('ref', ref_i, 'jitter raw', round(jitter(raw), 2), 'ecc', round(jitter(ecc), 2))
ecc_inv = np.array([cv2.perspectiveTransform(ref_q[None], np.linalg.inv(h))[0] for h in H])
med = lambda q: float(np.median(np.abs(q - raw)))
print("agree direct", med(ecc), "inv", med(ecc_inv))
np.save('quads_ecc.npy', ecc)
