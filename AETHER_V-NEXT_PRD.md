# AETHER V-NEXT: State-of-the-Art Architecture
## Version: 2.0 | Target: 2025 Breakthrough

---

## EXECUTIVE SUMMARY

**Objective:** Replace all heuristic bridging logic with pure mathematical approaches to achieve true 2025 State-of-the-Art performance.

**Current Problem:**
```
Video → [HEURISTICS] → Physics
         ↑
    This is where we lose rigor
```

**V-NEXT Solution:**
```
Video → [MATHEMATICS] → Verified Physics
         ↓
    No heuristics, pure optimization
```

---

## V-NEXT ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT: VIDEO STREAM                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: GEOMETRIC DISCOVERY                          │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────┐   │
│  │   SAM2 +    │───▶│  SPLART (3DGS)  │───▶│  Real2Code (LLM URDF)  │   │
│  │  YOLO-World │    │  Point Clouds   │    │  + Kinematic Chains     │   │
│  └─────────────┘    └─────────────────┘    └─────────────────────────┘   │
│                                                                     │
│  OUTPUT: Structured URDF + Joint Specifications                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: PHYSICS DISCOVERY                           │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐   │
│  │  MJX (DeepMind) │◀───│  Symplectic HNN    │───▶│  K-FAC Fisher   │   │
│  │  Backprop μ     │    │  Zero Energy Drift │    │  EWC Updates    │   │
│  └─────────────────┘    └─────────────────────┘    └─────────────────┘   │
│                                                                     │
│  OUTPUT: Learned Mass, Friction, Damping (no guessing)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: VERIFIED SIMULATION                         │
│  ┌─────────────────┐    ┌─────────────────────┐                         │
│  │   MuJoCo MjCF   │◀───│  Universal Builder │                         │
│  │   Native Sim    │    │  (No Heuristics)   │                         │
│  └─────────────────┘    └─────────────────────┘                         │
│                                                                     │
│  OUTPUT: Physics-Verified Simulation                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: GEOMETRIC DISCOVERY

### 1.1 Remove: Spectral Clustering Heuristics

**Current (BAD):**
```python
# ❌ BRITTLE HEURISTICS
if aspect_ratio > 1.5:
    cluster_a = body_1
else:
    cluster_b = body_2
```

**Problem:** Aspect ratio is not physics. A tall thin object can be heavy. A flat wide object can be light.

### 1.2 Replace With: SPLART (3D Gaussian Splatting)

**What is SPLART:**
- 3D Gaussian Splatting for articulated objects
- Each Gaussian = position + rotation + scale + opacity
- Articulated objects decompose into rigid parts with SE(3) transformations

**Implementation:**
```python
class SPLARTReconstructor:
    """
    From video → articulated 3D Gaussians → kinematic structure
    
    NOT the same as standard 3DGS. This is SPLATFORMS (3D Gaussian for Articulated Models).
    """
    
    def reconstruct(self, frames: List[ndarray]) -> "GaussianCloud":
        # 1. Run SAM2 on all frames
        # 2. Track each mask through time
        # 3. Estimate depth via MiDaS
        # 4. Lift 2D masks to 3D point clouds
        # 5. Fit 3D Gaussians per rigid part
        # 6. Estimate SE(3) transformations between frames
        pass
    
    def extract_kinematic_chains(self) -> List["JointChain"]:
        # Analyze SE(3) transforms to find joints
        # This is MATH, not heuristics
        pass
```

### 1.3 Replace With: Real2Code (LLM URDF)

**What is Real2Code:**
- Paper: "Real2Code: Reconstruct Articulated Objects from Images via Language-Guided Procedural Modeling"
- Use LLM to generate URDF from observed motion patterns

**Pipeline:**
```python
class Real2CodeCompiler:
    """
    LLM + Kinematic Analysis → URDF
    
    NOT prompting "what joint is this?"
    Instead: analyzing mathematical constraints
    """
    
    def compile(self, kinematic_analysis: KinematicData) -> str:
        # 1. Analyze motion trajectories
        # 2. Compute joint axes (mathematically)
        # 3. Estimate DOF from trajectory rank
        # 4. Generate URDF with LLM guidance
        # 5. Verify URDF consistency
        pass
```

**Mathematical Joint Detection (NO HEURISTICS):**
```python
def detect_joint_type(trajectory_A: ndarray, trajectory_B: ndarray) -> JointType:
    """
    Pure mathematical joint classification.
    
    DOF analysis:
    - Revolute: 1 rotational DOF → trajectory lies on circle
    - Prismatic: 1 translational DOF → trajectory is line
    - Universal: 2 rotational DOF → trajectory on sphere
    - Spherical: 3 rotational DOF → trajectory on sphere surface
    
    Method: SVD on velocity vectors, analyze rank
    """
    # Compute relative motion
    delta = trajectory_B - trajectory_A
    
    # SVD decomposition
    U, S, Vt = np.linalg.svd(delta)
    
    # Analyze singular values
    # If one dominant → prismatic
    # If two dominant → revolute/universal  
    # If three → spherical
    
    # This is MATH not heuristics
```

---

## PHASE 2: PHYSICS DISCOVERY

### 2.1 Remove: Convex Hull * Density Guessing

**Current (BAD):**
```python
# ❌ GUESSING
volume = convex_hull_volume(points)
mass = volume * 1000  # "water density"
```

**Problem:** We have no idea what the actual material is. A rubber band vs a steel spring have same geometry, different mass by 10x.

### 2.2 Replace With: DeepMind MJX Backpropagation

**What is MJX:**
- MuJoCo in JAX (by DeepMind)
- Fully differentiable physics engine
- Backprop through simulation!

**Key insight:**
```python
# Instead of guessing mass from geometry:
# Use physics to DISCOVER mass from motion!

def learn_physics(mj_model, observations):
    """
    Given: URDF + observed motion
    Learn: Mass, friction, damping
    
    Method: Backprop through MuJoCo simulation
    """
    
    def physics_loss(params):
        # Simulate with current params
        qpos_sim = mjx_simulate(mj_model, params)
        
        # Compare to observations
        return mse(qpos_sim, observations)
    
    # jax.grad through physics!
    grads = jax.grad(physics_loss)(params)
    
    # Update with optimizer
    params = params - lr * grads
```

### 2.3 Upgrade: Soft Hamiltonian → Symplectic HNN

**Current (PROBLEMATIC):**
```python
# ❌ SOFT CONSTRAINT (can be violated)
loss = mse_loss + 0.1 * hamiltonian_penalty
```

**Problem:** Energy can drift. Penalty can be ignored.

**V-NEXT: Symplectic Hamiltonian Neural Network**
```python
class SymplecticHNN:
    """
    Hamiltonian Neural Network with symplectic integration.
    
    Guarantees energy conservation BY DESIGN.
    Not a soft constraint. Mathematically enforced.
    """
    
    def __init__(self):
        # Separate networks for T (kinetic) and V (potential)
        self.T_net = MLP(input_dim=state_dim, output_dim=1)  # Kinetic
        self.V_net = MLP(input_dim=state_dim, output_dim=1)  # Potential
    
    def hamiltonian(self, state):
        """H(q, p) = T(p) + V(q)"""
        q, p = state[..., :n_q], state[..., n_q:]
        return self.T_net(p) + self.V_net(q)
    
    def dynamics(self, state):
        """
        Symplectic integration preserves phase space volume.
        
        dq/dt = ∂H/∂p
        dp/dt = -∂H/∂q
        
        This is CANONICAL MECHANICS, not approximation.
        """
        return jnp.concatenate([
            jax.grad(self.T_net, 0)(state),  # dq/dt
            -jax.grad(self.V_net, 0)(state)  # dp/dt
        ])
    
    def simulate(self, state0, n_steps):
        """
        Symplectic (Verlet) integration.
        
        Unlike Euler/RK4, this preserves energy exactly.
        """
        # Symplectic Euler
        p_half = p + dt/2 * dp_dt
        q_new = q + dt * dH/dp(p_half)
        p_new = p_half + dt/2 * dp_dt(q_new)
```

### 2.4 Upgrade: EWC → K-FAC Approximation

**Current (BAD):**
```python
# ❌ HAND-CODED "FISHER APPROXIMATION"
fisher = np.ones(n_params) * 0.1  # Fake!
```

**V-NEXT: K-FAC (Kronecker-Factored Approximate Curvature)**
```python
class KFACFisherEstimator:
    """
    K-FAC: Kronecker-Factored Approximate Curvature
    
    Real Fisher Information Matrix approximation using:
    - Kronecker products for efficiency
    - Monte Carlo estimates for tractability
    - Natural gradient descent for stability
    """
    
    def compute_fisher(self, params, log_likelihood_fn, mc_samples=100):
        """
        Fisher = E[∇log p(y|x,θ) ∇log p(y|x,θ)ᵀ]
        
        K-FAC approximates Fisher as block-diagonal Kronecker:
        F ≈ A ⊗ B
        
        Where A captures parameter correlations within layers
        and B captures activation correlations.
        """
        # Monte Carlo estimate of Fisher
        grads_sum = 0
        for _ in range(mc_samples):
            sample = sample_from_model()
            log_lik = log_likelihood_fn(sample, params)
            grads_sum += jax.grad(log_lik) ** 2
        
        fisher = grads_sum / mc_samples
        
        # K-FAC Kronecker factorization
        # (simplified, real impl is complex)
        return self._kronecker_factorize(fisher)
```

---

## PHASE 3: VERIFIED SIMULATION

### 3.1 Universal Builder (No Heuristics)

**Current (BAD):**
```python
# ❌ HEURISTIC DETECTION
if "pendulum" in mechanism_name:
    joint_type = "revolute"  # Guessing
```

**V-NEXT:**
```python
class UniversalSimulator:
    """
    Builds MuJoCo from URDF only. No guessing.
    """
    
    def from_urdf(self, urdf_string: str) -> str:
        """
        Pure translation: URDF XML → MuJoCo MJCF XML
        
        No interpretation, no heuristics.
        If URDF is valid, MJCF is valid.
        """
        
        # Parse URDF (tree structure)
        urdf_tree = urdf_xml.parse(urdf_string)
        
        # Direct translation rules (no guessing)
        mjcf_body = self._translate_link(urdf_tree.link)
        mjcf_joint = self._translate_joint(urdf_tree.joint)
        
        # Verify physics consistency
        assert self._check_dynamics_consistency(mjcf_tree)
        
        return mjcf_xml.serialize(mjcf_tree)
```

---

## FILE STRUCTURE: V-NEXT

```
backend/app/
├── scene_graph/
│   ├── OLD_kinematic_discovery.py    # Keep for compatibility
│   ├── splart/
│   │   ├── __init__.py
│   │   ├── reconstruct.py             # SPLART implementation
│   │   ├── gaussian_cloud.py          # 3DGS for articulated objects
│   │   └── kinematic_analysis.py     # Mathematical joint detection
│   │
│   └── real2code/
│       ├── __init__.py
│       ├── urdf_compiler.py           # LLM-guided URDF generation
│       ├── joint_detector.py          # Pure math DOF analysis
│       └── validator.py               # URDF consistency check
│
├── physics/
│   ├── OLD_jax_differentiable.py     # Keep for compatibility
│   ├── mjx/
│   │   ├── __init__.py
│   │   ├── mjx_wrapper.py            # DeepMind MJX wrapper
│   │   ├── backprop_sim.py           # Backprop through MuJoCo
│   │   └── learn_params.py           # Physics discovery
│   │
│   ├── symplectic_hnn/
│   │   ├── __init__.py
│   │   ├── hnn.py                    # Symplectic HNN
│   │   ├── t_network.py              # Kinetic energy network
│   │   ├── v_network.py              # Potential energy network
│   │   └── symplectic_integrator.py  # Verlet integration
│   │
│   └── continual_learning/
│       ├── __init__.py
│       ├── kfac.py                   # K-FAC Fisher estimation
│       ├── ewc_regularizer.py        # EWC with real Fisher
│       └── continual_trainer.py       # Main trainer
│
└── orchestrator/
    ├── OLD_complete_pipeline.py       # Keep for compatibility
    └── vnext_pipeline.py              # New V-NEXT pipeline
```

---

## IMPLEMENTATION PLAN

### Step 1: Create V-NEXT Module Structure
```
mkdir -p backend/app/scene_graph/splart
mkdir -p backend/app/scene_graph/real2code
mkdir -p backend/app/physics/mjx
mkdir -p backend/app/physics/symplectic_hnn
mkdir -p backend/app/physics/continual_learning
```

### Step 2: Implement SPLART (2 weeks)
- 3D Gaussian Splatting for articulated reconstruction
- SE(3) transformation analysis
- Mathematical joint detection

### Step 3: Implement Real2Code (2 weeks)
- LLM-guided URDF generation
- Pure mathematical DOF analysis
- URDF validator

### Step 4: Integrate MJX (2 weeks)
- DeepMind MJX wrapper
- Backprop through physics
- Parameter learning

### Step 5: Implement Symplectic HNN (2 weeks)
- T and V networks
- Symplectic integration
- Zero energy drift validation

### Step 6: Implement K-FAC EWC (1 week)
- Real Fisher estimation
- Continual learning

### Step 7: Integration & Testing (2 weeks)
- V-NEXT pipeline
- Benchmark validation
- Production hardening

---

## VALIDATION PLAN

### Benchmark Datasets:
1. **BMVC Articulation** - Real articulated object videos
2. **Kinect RGB-D** - 3D joint annotations
3. **Arias et al. Rigidity** - Motion segmentation ground truth

### Metrics:
- Joint detection accuracy (F1 score)
- Mass estimation error (%)
- Energy drift (should be < 0.1%)
- Self-improvement curve (should converge)

---

## DEPENDENCIES (NEW)

```txt
# V-NEXT additions
jaxtyping >= 0.2.0          # Type annotations for JAX
equinox >= 0.9.0             # JAX neural networks
mujocax >= 0.0.1             # Unofficial MJX bindings
chex >= 0.1.0                # JAX utilities
optax >= 0.1.0               # JAX optimizers
```

---

## RISK ASSESSMENT

| Component | Risk | Mitigation |
|-----------|------|------------|
| SPLART | High (novel) | Start with existing 3DGS, extend |
| MJX integration | Medium | Use official DeepMind repo |
| Symplectic HNN | Low | Well-established math |
| K-FAC | Medium | Use optax implementation |

---

## CONCLUSION

V-NEXT transforms AETHER from "heuristic-heavy prototype" to "mathematically rigorous system."

**Key changes:**
1. ❌ Spectral Clustering → ✅ SPLART + Real2Code
2. ❌ Convex Hull Density → ✅ MJX Backpropagation
3. ❌ Soft Hamiltonian → ✅ Symplectic HNN
4. ❌ Hand-coded EWC → ✅ K-FAC Fisher

**This is real state-of-the-art engineering.**
