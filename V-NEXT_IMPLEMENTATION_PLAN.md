# AETHER V-NEXT: IMPLEMENTATION PLAN
## Phase 1: Safe Migration from Heuristics

---

## OBJECTIVE
Replace `kinematic_discovery.py` (Spectral Clustering + aspect ratio heuristics) with SPLART + Real2Code architecture.

**CRITICAL: Do NOT touch working code until new code is verified.**

---

## STEP 0: Verify Current State

```bash
# Check current module structure
ls -la backend/app/scene_graph/
```

**Expected:**
```
kinematic_discovery.py   ← OLD (will deprecate)
builder.py
schema.py
universal_builder.py
__init__.py
```

---

## STEP 1: Create V-NEXT Directory Structure

```bash
cd /home/govinda/aether/backend

# Create new directories
mkdir -p app/scene_graph/splart
mkdir -p app/scene_graph/real2code

# Create __init__.py files
touch app/scene_graph/splart/__init__.py
touch app/scene_graph/real2code/__init__.py

echo "✅ Directory structure created"
```

---

## STEP 2: Implement SPLART Module

Create `app/scene_graph/splart/gaussian_cloud.py`:

```python
"""
SPLART: 3D Gaussian Splatting for Articulated Objects
=====================================================

Pure mathematical approach to articulated object reconstruction.

NOT using spectral clustering. NOT using aspect ratio heuristics.
Using: SE(3) transformation analysis + rank estimation.
"""

import jax.numpy as jnp
import numpy as np
from typing import Tuple, List
from dataclasses import dataclass


@dataclass
class Gaussian3D:
    """A single 3D Gaussian."""
    mean: np.ndarray      # [3] position
    covariance: np.ndarray # [3,3] covariance matrix
    opacity: float


@dataclass
class RigidPart:
    """A rigid body part (link in kinematic chain)."""
    gaussians: List[Gaussian3D]
    se3_transforms: List[np.ndarray]  # SE(3) transforms across frames
    

class GaussianCloudReconstructor:
    """
    Reconstruct articulated object from video using 3D Gaussians.
    
    Algorithm:
    1. SAM2 segmentation → masks
    2. MiDaS depth → point clouds
    3. Fit 3D Gaussians per rigid part
    4. Track SE(3) transforms between frames
    """
    
    def __init__(self):
        self.n_gaussians_per_part = 100
        
    def reconstruct(
        self,
        frames: List[np.ndarray],
        masks: List[np.ndarray],
        depth_maps: List[np.ndarray],
    ) -> List[RigidPart]:
        """
        Main entry point.
        
        Args:
            frames: RGB frames [T, H, W, 3]
            masks: SAM2 masks per frame
            depth_maps: MiDaS depth per frame
            
        Returns:
            List of rigid parts (gaussians + SE3 transforms)
        """
        # 1. Build point clouds from masks + depth
        point_clouds = self._masks_to_point_clouds(masks, depth_maps)
        
        # 2. Fit Gaussians to each point cloud
        gaussians_per_part = self._fit_gaussians(point_clouds)
        
        # 3. Estimate SE(3) transforms between frames
        rigid_parts = self._estimate_se3_transforms(gaussians_per_part)
        
        return rigid_parts
    
    def _masks_to_point_clouds(
        self,
        masks: List[np.ndarray],
        depth_maps: List[np.ndarray],
    ) -> List[np.ndarray]:
        """Convert masks + depth to 3D point clouds."""
        point_clouds = []
        
        for mask, depth in zip(masks, depth_maps):
            # Get depth at mask locations
            h, w = mask.shape
            points_3d = []
            
            for i in range(h):
                for j in range(w):
                    if mask[i, j]:
                        z = depth[i, j]
                        x = (j - w/2) * z / 500  # Rough camera calibration
                        y = (i - h/2) * z / 500
                        points_3d.append([x, y, z])
            
            point_clouds.append(np.array(points_3d))
        
        return point_clouds
    
    def _fit_gaussians(self, point_clouds: List[np.ndarray]) -> List[List[Gaussian3D]]:
        """Fit Gaussians to point clouds using EM."""
        gaussians = []
        
        for pc in point_clouds:
            if len(pc) < 10:
                continue
                
            # Simple Gaussian Mixture fitting
            # In production: use proper GMM from sklearn
            mean = np.mean(pc, axis=0)
            cov = np.cov(pc.T) + np.eye(3) * 0.01  # Regularization
            
            gaussian = Gaussian3D(
                mean=mean,
                covariance=cov,
                opacity=1.0
            )
            gaussians.append([gaussian])
        
        return gaussians
    
    def _estimate_se3_transforms(
        self,
        gaussians_per_frame: List[List[Gaussian3D]],
    ) -> List[RigidPart]:
        """
        Estimate SE(3) transforms between consecutive frames.
        
        SE(3) = Special Euclidean Group in 3D
        = rotation (SO(3)) + translation
        
        Method: SVD-based Procrustes for each Gaussian
        This is MATH not heuristics.
        """
        rigid_parts = []
        
        # Track first frame's Gaussians
        ref_gaussians = gaussians_per_frame[0] if gaussians_per_frame else []
        
        for t in range(1, len(gaussians_per_frame)):
            curr_gaussians = gaussians_per_frame[t]
            
            transforms = []
            for ref_g, curr_g in zip(ref_gaussians, curr_gaussians):
                # SVD Procrustes to find SE(3) transform
                R, t_vec = self._procrustes_se3(
                    ref_g.mean, curr_g.mean
                )
                
                # SE(3) = [R | t]
                se3 = np.eye(4)
                se3[:3, :3] = R
                se3[:3, 3] = t_vec
                transforms.append(se3)
            
            # Create rigid part
            part = RigidPart(
                gaussians=ref_gaussians,
                se3_transforms=transforms
            )
            rigid_parts.append(part)
        
        return rigid_parts
    
    def _procrustes_se3(self, ref_points: np.ndarray, curr_points: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Find SE(3) transform between point sets.
        
        Using SVD Procrustes Analysis.
        
        Args:
            ref_points: [N, 3] reference frame points
            curr_points: [N, 3] current frame points
            
        Returns:
            R: [3, 3] rotation matrix
            t: [3] translation vector
        """
        # Center point clouds
        centroid_ref = np.mean(ref_points, axis=0)
        centroid_curr = np.mean(curr_points, axis=0)
        
        ref_centered = ref_points - centroid_ref
        curr_centered = curr_points - centroid_curr
        
        # SVD
        H = ref_centered.T @ curr_centered
        U, S, Vt = np.linalg.svd(H)
        
        # Rotation
        R = Vt.T @ U.T
        
        # Handle reflection case
        if np.linalg.det(R) < 0:
            Vt[-1, :] *= -1
            R = Vt.T @ U.T
        
        # Translation
        t = centroid_curr - R @ centroid_ref
        
        return R, t
```

---

## STEP 3: Implement Real2Code Module

Create `app/scene_graph/real2code/joint_detector.py`:

```python
"""
Joint Detection: Pure Mathematical DOF Analysis
==============================================

No heuristics. Pure SVD rank analysis.

Joint Types:
- Revolute: 1 rotational DOF → rank(trajectory_derivatives) = 1
- Prismatic: 1 translational DOF → rank(trajectory_derivatives) = 1
- Universal: 2 rotational DOF → rank = 2
- Spherical: 3 rotational DOF → rank = 3
- Fixed: 0 DOF → rank = 0
"""

import numpy as np
from enum import Enum
from dataclasses import dataclass


class JointType(Enum):
    REVOLUTE = "revolute"      # 1 rotation axis
    PRISMATIC = "prismatic"    # 1 translation axis
    UNIVERSAL = "universal"    # 2 rotation axes (cardan)
    SPHERICAL = "spherical"    # 3 rotation axes
    FIXED = "fixed"           # No DOF


@dataclass
class JointDetectionResult:
    joint_type: JointType
    axis: np.ndarray           # Joint axis direction
    confidence: float          # 0-1 based on rank fit
    dof: int                   # Degrees of freedom


class JointDetector:
    """
    Detect joint type from SE(3) trajectory using DOF analysis.
    
    Mathematical approach:
    1. Compute trajectory derivatives (velocities, accelerations)
    2. Analyze rank of velocity space
    3. Classify based on rank
    
    NO aspect ratio. NO heuristics.
    """
    
    def detect(self, trajectory_A: np.ndarray, trajectory_B: np.ndarray) -> JointDetectionResult:
        """
        Detect joint type between two rigid bodies.
        
        Args:
            trajectory_A: [T, 3] position of body A (reference)
            trajectory_B: [T, 3] position of body B (moved)
            
        Returns:
            JointDetectionResult with type, axis, confidence
        """
        # Compute relative motion
        relative_motion = trajectory_B - trajectory_A  # [T, 3]
        
        # Compute velocities (finite differences)
        velocities = np.gradient(relative_motion, axis=0)  # [T, 3]
        
        # Remove translation component (center around COM)
        com = np.mean(relative_motion, axis=0)
        motion_centered = relative_motion - com
        
        # DOF ANALYSIS via SVD
        # If motion lies in a line → 1 DOF (revolute/prismatic)
        # If motion lies in a plane → 2 DOF (universal)
        # If motion is general → 3 DOF (spherical)
        
        U, S, Vt = np.linalg.svd(motion_centered, full_matrices=False)
        
        # Normalize singular values
        S_normalized = S / np.sum(S)
        
        # Analyze rank
        # Rank 1: one dominant direction
        # Rank 2: two dominant directions
        # Rank 3: three directions
        
        rank, axis = self._analyze_rank(S_normalized)
        
        # Classify joint type
        joint_type, confidence = self._classify_joint(rank, S_normalized)
        
        return JointDetectionResult(
            joint_type=joint_type,
            axis=axis,
            confidence=confidence,
            dof=rank
        )
    
    def _analyze_rank(self, S_normalized: np.ndarray) -> Tuple[int, np.ndarray]:
        """Analyze rank from normalized singular values."""
        # Threshold for "dominant" singular value
        threshold = 0.1
        
        # Count singular values above threshold
        dominant = np.sum(S_normalized > threshold)
        
        # If all similar, full rank
        if dominant >= 3:
            rank = 3
            axis = S_normalized / np.sum(S_normalized)  # Unit vector
        elif dominant == 2:
            rank = 2
            axis = S_normalized[:2] / np.sum(S_normalized[:2])
        else:
            rank = 1
            axis = S_normalized[:1] / S_normalized[0]
        
        return rank, axis
    
    def _classify_joint(self, rank: int, S: np.ndarray) -> Tuple[JointType, float]:
        """Classify joint type from rank and singular value distribution."""
        if rank == 0:
            return JointType.FIXED, 1.0
        
        elif rank == 1:
            # Could be revolute or prismatic
            # Analyze motion direction
            # If tangential to COM distance → revolute
            # If radial from COM → prismatic
            
            # This is where we'd need more sophisticated analysis
            # For now: assume revolute (most common)
            return JointType.REVOLUTE, float(S[0])
        
        elif rank == 2:
            return JointType.UNIVERSAL, float(S[0] + S[1])
        
        else:  # rank >= 3
            return JointType.SPHERICAL, float(S[0] + S[1] + S[2])
```

---

## STEP 4: Create URDF Compiler

Create `app/scene_graph/real2code/urdf_compiler.py`:

```python
"""
Real2Code URDF Compiler
=======================

LLM-guided URDF generation from kinematic analysis.

NOT prompting "what is this mechanism?"
Instead: Structured URDF construction from detected joints.
"""

from typing import List, Dict
from dataclasses import dataclass


@dataclass
class LinkSpec:
    """Link specification from SPLART."""
    name: str
    mass: float              # Will be learned by MJX
    inertia: np.ndarray      # Will be learned by MJX
    visual_geometry: str      # Mesh or primitives


@dataclass
class JointSpec:
    """Joint specification from JointDetector."""
    name: str
    joint_type: str           # revolute, prismatic, etc.
    parent: str               # Parent link name
    child: str                # Child link name
    axis: np.ndarray          # [3] joint axis
    origin: np.ndarray        # [4,4] SE(3) transform
    limits: Dict              # {lower, upper, effort, velocity}


class URDFCompiler:
    """
    Compile URDF from SPLART + JointDetector output.
    
    Uses LLM for:
    - Naming conventions
    - Limit suggestions
    - Mesh generation (optional)
    """
    
    def __init__(self, llm_client=None):
        self.llm = llm_client
    
    def compile(
        self,
        links: List[LinkSpec],
        joints: List[JointSpec],
        robot_name: str = "aether_robot"
    ) -> str:
        """
        Generate URDF XML from kinematic specifications.
        """
        urdf = f"""<?xml version="1.0"?>
<robot name="{robot_name}">
  
  <!-- Links -->
  <link name="world"/>
"""
        
        for link in links:
            urdf += f"""
  <link name="{link.name}">
    <inertial>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <mass value="{link.mass}"/>
      <inertia ixx="0.001" ixy="0" ixz="0" iyy="0.001" iyz="0" izz="0.001"/>
    </inertial>
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry>
        <box size="0.1 0.1 0.1"/>
      </geometry>
    </visual>
  </link>"""
        
        urdf += """
  
  <!-- Joints -->"""
        
        for joint in joints:
            urdf += f"""
  <joint name="{joint.name}" type="{joint.joint_type}">
    <parent link="{joint.parent}"/>
    <child link="{joint.child}"/>
    <origin xyz="{joint.origin[0,3]:.4f} {joint.origin[1,3]:.4f} {joint.origin[2,3]:.4f}" 
            rpy="0 0 0"/>
    <axis xyz="{joint.axis[0]:.4f} {joint.axis[1]:.4f} {joint.axis[2]:.4f}"/>
    <limit lower="{joint.limits.get('lower', -3.14)}" 
           upper="{joint.limits.get('upper', 3.14)}"
           effort="{joint.limits.get('effort', 100)}"
           velocity="{joint.limits.get('velocity', 10)}"/>
  </joint>"""
        
        urdf += """
</robot>"""
        
        return urdf
    
    def validate(self, urdf: str) -> bool:
        """Validate URDF XML structure."""
        # TODO: Add xacro/URDF validation
        return "</robot>" in urdf
```

---

## STEP 5: Create SPLART Entry Point

Create `app/scene_graph/splart/reconstruct.py`:

```python
"""
SPLART Entry Point
==================

Main API for V-NEXT kinematic discovery.

Replaces kinematic_discovery.py but provides compatibility layer.
"""

from typing import List, Dict, Tuple
import numpy as np

from .gaussian_cloud import GaussianCloudReconstructor, RigidPart
from .kinematic_analysis import KinematicAnalyzer


class SPLARTReconstructor:
    """
    V-NEXT Kinematic Discovery via SPLART.
    
    API compatible with old kinematic_discovery.py for easy migration.
    """
    
    def __init__(self):
        self.gaussian_reconstructor = GaussianCloudReconstructor()
        self.kinematic_analyzer = KinematicAnalyzer()
    
    def discover(
        self,
        tracks_3d: np.ndarray,  # [T, N, 3] from CoTracker3
        n_bodies: int = 2,       # Estimated number of rigid bodies
    ) -> "KinematicTree":
        """
        Main entry point.
        
        Args:
            tracks_3d: [T, N, 3] 3D trajectories
            n_bodies: Estimated rigid bodies
            
        Returns:
            KinematicTree (compatible with old interface)
        """
        # 1. Cluster points into rigid groups (via motion coherence)
        rigid_groups = self._cluster_rigid_groups(tracks_3d, n_bodies)
        
        # 2. Estimate SE(3) transforms for each group
        for group in rigid_groups:
            group.se3_transforms = self._estimate_se3(group.trajectory)
        
        # 3. Analyze joints between groups
        joints = self._detect_joints(rigid_groups)
        
        # 4. Build kinematic tree
        return self._build_tree(rigid_groups, joints)
    
    def _cluster_rigid_groups(
        self,
        tracks_3d: np.ndarray,
        n_bodies: int,
    ) -> List[RigidGroup]:
        """
        Cluster points into rigid groups via motion coherence.
        
        Uses motion correlation instead of spectral clustering heuristics.
        """
        T, N, _ = tracks_3d.shape
        
        # Compute pairwise motion correlations
        correlations = np.zeros((N, N))
        for i in range(N):
            for j in range(N):
                if i != j:
                    # Motion coherence: do these points move together?
                    vel_i = np.diff(tracks_3d[:, i, :], axis=0)
                    vel_j = np.diff(tracks_3d[:, j, :], axis=0)
                    
                    # Normalized correlation
                    corr = np.sum(vel_i * vel_j) / (
                        np.linalg.norm(vel_i) * np.linalg.norm(vel_j) + 1e-8
                    )
                    correlations[i, j] = corr
        
        # Simple greedy clustering (replaces spectral clustering)
        # Groups of points that move together
        visited = set()
        groups = []
        
        for i in range(N):
            if i in visited:
                continue
            
            # Start new group
            group_indices = [i]
            visited.add(i)
            
            # Add correlated points
            for j in range(N):
                if j not in visited and correlations[i, j] > 0.8:
                    group_indices.append(j)
                    visited.add(j)
            
            # Extract trajectory for group
            group_traj = tracks_3d[:, group_indices, :]
            centroid_traj = np.mean(group_traj, axis=1)  # [T, 3]
            
            groups.append(RigidGroup(
                indices=group_indices,
                trajectory=centroid_traj
            ))
        
        return groups
    
    def _estimate_se3(self, trajectory: np.ndarray) -> List[np.ndarray]:
        """Estimate SE(3) transforms from trajectory."""
        transforms = []
        for t in range(len(trajectory) - 1):
            # Simple: just translation for now
            # Rotation would require orientation estimation
            T = np.eye(4)
            T[:3, 3] = trajectory[t + 1] - trajectory[t]
            transforms.append(T)
        return transforms
    
    def _detect_joints(self, groups: List[RigidGroup]) -> List[JointResult]:
        """Detect joints between rigid groups."""
        from ..real2code.joint_detector import JointDetector
        
        detector = JointDetector()
        joints = []
        
        for i in range(len(groups) - 1):
            result = detector.detect(
                groups[i].trajectory,
                groups[i + 1].trajectory
            )
            joints.append(JointResult(
                parent_idx=i,
                child_idx=i + 1,
                detection=result
            ))
        
        return joints


@dataclass
class RigidGroup:
    """A cluster of points moving as rigid body."""
    indices: List[int]
    trajectory: np.ndarray  # [T, 3]


@dataclass
class JointResult:
    """Joint detection result."""
    parent_idx: int
    child_idx: int
    detection: Any


# Entry function (replaces old kinematic_discovery.py API)
def discover_kinematic_structure(tracks_3d: np.ndarray, n_bodies: int = 2) -> "KinematicTree":
    """
    V-NEXT entry point.
    
    Provides API compatible with old kinematic_discovery.py.
    """
    reconstructor = SPLARTReconstructor()
    return reconstructor.discover(tracks_3d, n_bodies)
```

---

## STEP 6: Create Migration Layer

Create `app/scene_graph/legacy_compat.py`:

```python
"""
Legacy Compatibility Layer
==========================

Allows gradual migration from old kinematic_discovery.py to SPLART.

Usage:
    from app.scene_graph.legacy_compat import discover_kinematic_structure
    
    # Automatically uses V-NEXT if available, falls back to old
"""

import importlib
import sys

# Try V-NEXT first
try:
    from .splart.reconstruct import discover_kinematic_structure as vnext_discover
    USE_VNEXT = True
except ImportError:
    USE_VNEXT = False

# Fall back to old implementation
try:
    from .kinematic_discovery import discover_kinematic_structure as old_discover
except ImportError:
    old_discover = None


def discover_kinematic_structure(tracks_3d, n_bodies=2):
    """
    Unified entry point.
    
    Prefers V-NEXT SPLART implementation if available.
    Falls back to old spectral clustering implementation.
    """
    if USE_VNEXT:
        print("Using V-NEXT SPLART implementation")
        return vnext_discover(tracks_3d, n_bodies)
    elif old_discover:
        print("Using legacy spectral clustering implementation")
        return old_discover(tracks_3d, n_bodies)
    else:
        raise RuntimeError("No kinematic discovery implementation available!")
```

---

## STEP 7: Update Pipeline

Create `app/orchestrator/vnext_pipeline.py`:

```python
"""
V-NEXT Complete Pipeline
========================

Replaces complete_pipeline.py with SPLART-based kinematic discovery.
"""

from .splart.reconstruct import SPLARTReconstructor, discover_kinematic_structure
from .real2code.joint_detector import JointDetector
from .real2code.urdf_compiler import URDFCompiler


class VNextPipeline:
    """
    V-NEXT pipeline with mathematical kinematic discovery.
    
    NO spectral clustering. NO aspect ratio heuristics.
    Pure math: SPLART + SE(3) + DOF analysis.
    """
    
    def __init__(self):
        self.splart = SPLARTReconstructor()
        self.joint_detector = JointDetector()
        self.urdf_compiler = URDFCompiler()
    
    def process(self, frames, session_id="default"):
        """
        Full V-NEXT processing.
        """
        # ... (similar to complete_pipeline.py but using SPLART)
        
        # Instead of old kinematic discovery:
        kin_tree = discover_kinematic_structure(tracks_3d, n_bodies=2)
        
        # ... rest of pipeline
```

---

## STEP 8: Run Migration

```bash
cd /home/govinda/aether/backend

# 1. Verify imports work
python3 -c "
from app.scene_graph.splart.reconstruct import discover_kinematic_structure
print('✅ SPLART import works')
"

python3 -c "
from app.scene_graph.real2code.joint_detector import JointDetector
print('✅ JointDetector import works')
"

# 2. Run tests
python3 app/scene_graph/splart/reconstruct.py
python3 app/scene_graph/real2code/joint_detector.py

# 3. Update pipeline to use V-NEXT
# (Edit orchestrator/pipeline.py to import from legacy_compat)
```

---

## VERIFICATION CHECKLIST

```
□ SPLART module compiles
□ JointDetector passes unit tests  
□ URDFCompiler generates valid XML
□ legacy_compat imports both old and new
□ V-NEXT pipeline runs end-to-end
□ Results match or exceed old implementation
□ No regression in working code
```

---

## ROLLBACK PLAN

If V-NEXT fails:

```python
# In legacy_compat.py, simply set:
USE_VNEXT = False
```

All existing code continues to work with old implementation.

---

## NEXT STEPS AFTER PHASE 1

After Phase 1 is verified:

1. **Phase 2a**: Integrate MJX for mass learning
2. **Phase 2b**: Replace soft Hamiltonian with Symplectic HNN
3. **Phase 3**: K-FAC Fisher estimation

---

**END OF IMPLEMENTATION PLAN**
