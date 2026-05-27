#!/usr/bin/env python3
"""
AETHER Kinematic Discovery Demo
===============================

This script demonstrates the unsupervised kinematic discovery algorithm.
Run it with: python demo_kinematic_discovery.py

The algorithm:
1. Generates synthetic trajectory data for a mechanism
2. Uses spectral clustering to group points into rigid bodies
3. Computes SE(3) transformations between bodies
4. Classifies joints based on degrees of freedom analysis
"""

import numpy as np
import sys
sys.path.insert(0, '/home/govinda/aether/backend')

from app.scene_graph.kinematic_discovery import (
    discover_kinematic_structure,
    kinematic_tree_to_mjcf,
    JointType,
)


def create_synthetic_pendulum(n_points: int = 20, n_frames: int = 60) -> np.ndarray:
    """Create synthetic pendulum trajectories."""
    t = np.linspace(0, 2*np.pi, n_frames)
    
    # Pendulum: pivot at origin, bob swings
    tracks = np.zeros((n_frames, n_points, 3))
    
    for i in range(n_points):
        frac = (i + 1) / n_points  # 0 to 1 along pendulum
        
        for frame in range(n_frames):
            angle = 0.5 * np.sin(t[frame])  # Swing angle
            
            # Position: rotates around z-axis
            tracks[frame, i, 0] = 0.5 * frac * np.sin(angle)  # x
            tracks[frame, i, 1] = -0.5 * frac * (1 - np.cos(angle))  # y (drops)
            tracks[frame, i, 2] = 1.0 + 0.5 * frac * np.cos(angle)  # z
    
    return tracks


def create_synthetic_2link_arm(n_frames: int = 60) -> np.ndarray:
    """Create synthetic 2-link robot arm trajectories."""
    t = np.linspace(0, 2*np.pi, n_frames)
    
    n_points_link1 = 15
    n_points_link2 = 15
    n_points = n_points_link1 + n_points_link2
    
    tracks = np.zeros((n_frames, n_points, 3))
    
    # Link 1: base to joint 1
    for i in range(n_points_link1):
        frac = (i + 1) / n_points_link1
        for frame in range(n_frames):
            angle1 = 0.8 * np.sin(t[frame])
            tracks[frame, i, 0] = 0.4 * frac * np.cos(angle1)
            tracks[frame, i, 1] = 0.4 * frac * np.sin(angle1)
            tracks[frame, i, 2] = 1.0
    
    # Link 2: joint 1 to end effector
    for i in range(n_points_link2):
        frac = (i + 1) / n_points_link2
        for frame in range(n_frames):
            angle1 = 0.8 * np.sin(t[frame])
            angle2 = 0.6 * np.sin(t[frame] * 1.3 + 1.0)
            
            # End of link 1
            x1 = 0.4 * np.cos(angle1)
            y1 = 0.4 * np.sin(angle1)
            
            # End of link 2
            tracks[frame, n_points_link1 + i, 0] = x1 + 0.3 * frac * np.cos(angle1 + angle2)
            tracks[frame, n_points_link1 + i, 1] = y1 + 0.3 * frac * np.sin(angle1 + angle2)
            tracks[frame, n_points_link1 + i, 2] = 1.0
    
    return tracks


def create_synthetic_slider_crank(n_frames: int = 60) -> np.ndarray:
    """Create synthetic slider-crank mechanism."""
    t = np.linspace(0, 2*np.pi, n_frames)
    
    n_points_crank = 10
    n_points_slider = 15
    n_points = n_points_crank + n_points_slider
    
    tracks = np.zeros((n_frames, n_points, 3))
    
    # Crank: rotates around origin
    for i in range(n_points_crank):
        frac = (i + 1) / n_points_crank
        for frame in range(n_frames):
            angle = t[frame]
            tracks[frame, i, 0] = 0.2 * frac * np.cos(angle)
            tracks[frame, i, 1] = 0.2 * frac * np.sin(angle)
            tracks[frame, i, 2] = 1.0
    
    # Slider: moves along x-axis
    for i in range(n_points_slider):
        frac = (i + 1) / n_points_slider
        for frame in range(n_frames):
            angle = t[frame]
            slider_x = 0.3 * np.cos(angle) + 0.3  # Connecting rod offset
            tracks[frame, n_points_crank + i, 0] = slider_x + 0.1 * frac
            tracks[frame, n_points_crank + i, 1] = 0.1 * frac
            tracks[frame, n_points_crank + i, 2] = 1.0
    
    return tracks


def main():
    print("=" * 70)
    print("AETHER: Unsupervised Kinematic Discovery Demo")
    print("=" * 70)
    
    mechanisms = [
        ("Pendulum", create_synthetic_pendulum),
        ("2-Link Arm", create_synthetic_2link_arm),
        ("Slider-Crank", create_synthetic_slider_crank),
    ]
    
    for name, generator in mechanisms:
        print(f"\n{'=' * 70}")
        print(f"Testing: {name}")
        print("-" * 70)
        
        # Generate synthetic trajectories
        tracks = generator()
        print(f"Generated: {tracks.shape[0]} frames, {tracks.shape[1]} points, 3D")
        
        # Discover kinematic structure
        tree = discover_kinematic_structure(tracks, n_bodies=None)
        
        print(f"\nResults:")
        print(f"  Bodies discovered: {tree.n_bodies}")
        print(f"  Joints discovered: {tree.n_joints}")
        
        for joint in tree.joints:
            print(f"  - {joint.parent_id} → {joint.child_id}: {joint.joint_type.value} (conf={joint.confidence:.2f})")
            if joint.axis is not None:
                print(f"    Axis: [{joint.axis[0]:.3f}, {joint.axis[1]:.3f}, {joint.axis[2]:.3f}]")
        
        # Generate MuJoCo model
        mjcf = kinematic_tree_to_mjcf(tree)
        print(f"\nGenerated MuJoCo XML ({len(mjcf)} chars)")
        print(mjcf[:300] + "...")
        
        print()
    
    print("=" * 70)
    print("Demo complete!")
    print("=" * 70)
    print("""
To use with real video:
1. Run AETHER pipeline on video
2. Extract CoTracker3 trajectories  
3. Pass to discover_kinematic_structure()
4. Get kinematic tree + MuJoCo model
""")


if __name__ == "__main__":
    main()
