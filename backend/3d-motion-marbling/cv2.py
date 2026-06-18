import numpy as np
from scipy.spatial.transform import Rotation


def Rodrigues(src):
    arr = np.asarray(src, dtype=float)
    if arr.shape == (3, 3):
        rotvec = Rotation.from_matrix(arr).as_rotvec().reshape(3, 1)
        return rotvec, np.zeros((9, 3), dtype=float)

    rotvec = arr.reshape(3)
    matrix = Rotation.from_rotvec(rotvec).as_matrix()
    return matrix, np.zeros((3, 9), dtype=float)
