# AETHER V-NEXT: The 5 'Holy Grail' Physics Tests

To prove that AETHER is a 10/10 breakthrough, it must pass these five tests. Most AI systems (and even most simulators) fail at least three of these.

---

### TEST 1: The Chaotic Double Pendulum
*   **The Challenge:** Ingest a video of a double pendulum.
*   **Success Criteria:**
    1.  **Topology:** Correctly compile a URDF with TWO nested hinge joints (Link A -> Joint 1 -> Link B -> Joint 2).
    2.  **Dynamics:** Use MJX backprop to find the exact mass ratios of the two bobs.
    3.  **HNN Verification:** Simulate the trajectory for 60 seconds with **Zero Divergence** from the physical law of conservation.
*   **Why it's hard:** Small errors in mass or friction lead to exponential divergence in chaotic systems.

### TEST 2: The Compliant 'Living' Gripper
*   **The Challenge:** Ingest a video of a 3D-printed compliant mechanism (e.g., a fin-ray gripper) deforming.
*   **Success Criteria:**
    1.  **Differentiable Stiffness:** Backprop through the motion to discover the non-linear spring constants of the material.
    2.  **Contact Physics:** Correctly model the friction coefficients between the gripper and a random object.
*   **Why it's hard:** Standard URDFs assume rigid bodies. AETHER must "hallucinate" the flex as a series of virtual joints.

### TEST 3: The 100-DOF Bike Chain
*   **The Challenge:** Ingest a video of a high-speed bicycle chain or a tank tread.
*   **Success Criteria:**
    1.  **Compilation Speed:** Autonomously write a 100+ link MJCF file in < 10 seconds using MiniMax.
    2.  **Constraint Stability:** The MJX simulation must not "explode" (numerical instability) under high-speed rotation.
*   **Why it's hard:** Traditional manual modeling of 100 joints takes hours. AETHER does it in seconds.

### TEST 4: The Hidden Gear Ratio (Inference)
*   **The Challenge:** A video shows Gear A spinning and Gear B spinning 3x faster, but the internal gears are hidden inside a box.
*   **Success Criteria:**
    1.  **Physical Reasoning:** MiniMax must deduce the existence of a 1:3 gear ratio even though it cannot see the internal teeth.
    2.  **Functional Compilation:** Write a `tendon` or `transmission` tag in MuJoCo to represent the hidden constraint.
*   **Why it's hard:** Requires moving beyond "visual tracking" into "functional inference."

### TEST 5: The Magnus Effect (Fluid Interaction)
*   **The Challenge:** A video of a spinning football (soccer ball) curving into the top corner.
*   **Success Criteria:**
    1.  **Impulse Discovery:** MJX backprop calculates the exact Newtons of force applied at the moment of impact.
    2.  **Air Resistance:** Discover the spin-rate (RPM) required to match the visual curve.
*   **Why it's hard:** Requires modeling the interaction between a rigid body and an invisible fluid (air).
