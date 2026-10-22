import cv2, numpy as np, sys
S='/tmp/claude-0/-home-user-fullstack-nanodegree-vm/bb642924-795c-5e56-8daf-3ed1bc2d34f7/scratchpad/'
srcs={'momo':'/root/.claude/uploads/bb642924-795c-5e56-8daf-3ed1bc2d34f7/994d3b8a-image.jpg','scout':'/root/.claude/uploads/bb642924-795c-5e56-8daf-3ed1bc2d34f7/7131e38f-image.jpg'}
for k,p in srcs.items():
    im=cv2.imread(p); g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY).astype(np.float32)
    bg=cv2.GaussianBlur(cv2.dilate(g,np.ones((25,25))),(0,0),25)
    r=g/np.maximum(bg,1)
    ink=(r<0.55).astype(np.uint8)
    cv2.imwrite(S+k+'_ink.png',255-ink*255)
    # show grid
    vis=im.copy()
    for x in range(0,vis.shape[1],100): cv2.line(vis,(x,0),(x,vis.shape[0]),(0,0,255) if x%500==0 else (0,200,0),1)
    for y in range(0,vis.shape[0],100): cv2.line(vis,(0,y),(vis.shape[1],y),(0,0,255) if y%500==0 else (0,200,0),1)
    cv2.imwrite(S+k+'_grid.jpg',vis)
