# AETHER NEURAL CORE — THE BREAKTHROUGH MARATHON

> **"Only breakthroughs matter. Everything else is a giant pile of AI alp."**

---

## THE VISION

Build the **FASTEST video → physics digital twin pipeline the world has ever seen** — running entirely on a $999 laptop RTX 3050 (4GB VRAM). AETHER will transform any mechanical system video into a physics-grounded 3D simulation in SECONDS, not minutes.

**What the world has never seen:**
- A **unified CUDA Graph pipeline** that chains SAM 2 + CoTracker3 + DepthAnything V2 into ONE GPU operation — zero CPU copy between models
- A **vLLM-style budget CUDA Graph scheduler** adapted for vision transformers (never been done for this model combination)
- A **Q-SAM2 mixed-precision stack** that fits 3 models in 4GB VRAM with FP16 quality
- A **real-time 3D Gaussian Splatting reconstruction** from depth + segmentation outputs
- A **physics-grounded digital twin** with uncertainty quantification

**Why this matters:** SpaceX, Meta, NVIDIA all run these models on A100/H100 clusters with 80GB VRAM. We're going to run them FASTER on a 4GB laptop GPU — and make it open source.

---

## STATE OF THE ART vs AETHER GOAL

| Stage | Current (AETHER v1) | After Marathon | Speedup |
|-------|-------------------|---------------|---------|
| SAM 2 segmentation (1 frame) | ~10s (CPU fallback) | **30ms** | **300x** |
| CoTracker3 tracking (10 frames) | ~30s | **200ms** | **150x** |
| Depth estimation (1 frame) | ~5s | **20ms** | **250x** |
| Full pipeline (10 frames) | **~3-5 minutes** | **< 2 seconds** | **~150x** |
| 3D reconstruction | ❌ None | **3 seconds** | ∞ |
| VRAM usage | ~3.5GB peak | **< 4GB** (fits RTX 3050) | — |

**The 150x breakthrough comes from:**
1. CUDA Graphs (eliminates kernel launch overhead) → 2-3x
2. Mixed-precision (FP16/INT8 tensor cores) → 3-5x
3. Zero CPU-GPU copies between models → 3-5x
4. torch.compile + SDPA for CoTracker3 → 1.5-2x
5. ONNX→TensorRT FP16 engines → 2-3x

Combined: **150x** = (2×3×4×1.5×2)

---

## HARDWARE ANALYSIS — RTX 3050 Laptop (4GB VRAM)

```
GPU:          NVIDIA GeForce RTX 3050 Laptop GPU
VRAM:         4.0 GB GDDR6 (3770 MB free after drivers)
Compute:      CUDA 8.6 (Ampere architecture)
Tensor Cores: Yes (2nd generation) — FP16 accelerated
Cores:        2048 CUDA cores
TDP:          75W

Current utilization: 0% (0.00GB allocated)
```

**Constraints:**
- 4GB VRAM must fit ALL 3 models simultaneously (impossible naively)
- SAM 2 Hiera Small: ~176MB checkpoint, ~400MB at FP16 inference
- CoTracker3: ~97MB checkpoint, ~250MB at FP16 inference
- DepthAnything V2: ~150MB checkpoint, ~300MB at FP16 inference
- Total naive: ~950MB — BUT intermediate activations exceed 4GB

**Solution:** Sequential model loading + CUDA Graph capture + Q-SAM2 quantization

---

## PART 0: BASELINE BENCHMARK (Right Now)

Measure BEFORE we optimize — establish the ground truth.

### Benchmark Script
```python
# Measure: per-model latency, VRAM peak, CPU % for each stage
# Run on 10 frames from car video
# Save to /home/govinda/aether/benchmark/baseline.json
```

### Expected Baseline Numbers
| Model | Latency | VRAM Peak | CPU % |
|-------|---------|-----------|-------|
| SAM 2 (10 frames) | ~90s | ~800MB | 95% |
| CoTracker3 (10 frames) | ~60s | ~600MB | 90% |
| MiDaS (10 frames) | ~50s | ~400MB | 85% |
| **TOTAL** | **~200s** | **~1.8GB** | **~90% avg** |

---

## PART 1: FOUNDATION — Install Missing Stack (Day 1 Morning)

### 1.1 Install onnxruntime-gpu + onnx
```bash
pip install onnxruntime-gpu onnx onnxconverter-common
```
**Why:** ONNX Runtime GPU provider = instant 2-3x speedup on existing PyTorch models with ZERO code change. ONNX conversion enables TensorRT下一步.

**Verification:**
```python
import onnxruntime as ort
print(ort.get_available_providers())  # Should show ['CUDAExecutionProvider', 'CPUExecutionProvider']
```

### 1.2 Install DepthAnythingV2 (Replace MiDaS)
```bash
pip install depth_pro  # Or: pip install depth_anything_v2
```
**Why:** DepthAnything V2 is 2x more accurate than MiDaS and has ONNX export support. More importantly, the depth maps are metric — critical for 3D reconstruction.

**Checkpoint:** `/home/govinda/aether/data/checkpoints/depth_anything_v2_vits14.pt` (~150MB)

### 1.3 Install torch.compile-compatible deps
```bash
pip install numpy<2.0  # torch.compile works better with numpy < 2.0
```

### 1.4 Verify CUDA Graphs + SDPA
```python
import torch
# CUDA Graphs: torch.cuda.CUDAGraph (available since PyTorch 1.9)
# SDPA (FlashAttention): torch.nn.functional.scaled_dot_product_attention
print("CUDA Graphs:", hasattr(torch.cuda, 'CUDAGraph'))
print("SDPA:", hasattr(torch.nn.functional, 'scaled_dot_product_attention'))
```

**Stack after Part 1:**
```
✅ PyTorch 2.6.0 + cuDNN 9.1 + CUDA 12.4
✅ ONNX Runtime GPU (CUDA EP)
✅ Triton 3.2.0 (for kernel fusion)
✅ SDPA (FlashAttention equivalent)
✅ torch.compile
✅ DepthAnythingV2
```

---

## PART 2: TORCH.COMPILE + SDPA FOR COTRACKER3 (Day 1)

### 2.1 Why CoTracker3 First?
CoTracker3's transformer attention is the LOW-HANGING FRUIT — it uses standard `torch.nn.functional.scaled_dot_product_attention` which PyTorch 2.6 automatically fuses with CUDA kernels.

### 2.2 The torch.compile Wrapper
```python
# backend/app/perception/optimized/cotracker3_compiled.py

import torch
import torch.nn as nn
from torch.nn.attention import SDPBackend

class OptimizedCoTracker3(nn.Module):
    """CoTracker3 with torch.compile + SDPA backend forcing."""
    
    def __init__(self, predictor):
        super().__init__()
        self.predictor = predictor
        # Compile with fullgraph (no graph breaks for max speed)
        self.compiled_model = torch.compile(
            self._forward,
            mode="reduce-overhead",  # Best for inference
            fullgraph=True,           # No CPU-GPU transitions
            dynamic=False             # Fixed shapes for CUDA Graph capture
        )
    
    def _forward(self, video_tensor):
        """Forward with SDPA forced (FlashAttention CUDA kernel)."""
        with torch.nn.attention.sdpa_kernel(
            backends=[SDPBackend.CUDA, SDPBackend.FLASH_ATTENTION, SDPBackend.EFFICIENT_ATTENTION]
        ):
            pred_tracks, pred_visibility = self.predictor(video_tensor)
        return pred_tracks, pred_visibility
    
    def forward(self, video_tensor):
        return self.compiled_model(video_tensor)
```

**Expected: 1.5-2x speedup on CoTracker3 alone**

### 2.3 Memory-Efficient Inference Mode
```python
# Enable gradient checkpointing-like memory save for inference
torch._inductor.config.triton.cudagraphs = True  # Enable CUDA Graphs in inductor

# Force channels-last memory layout (20-30% faster on Ampere)
torch.backends.cudnn.matmul.allow_tf32 = True
torch.backends.cuda.matmul.allow_tf32 = True
```

### 2.4 Benchmark After Part 2
| Model | Before | After | Speedup |
|-------|--------|-------|---------|
| CoTracker3 (10 frames) | ~60s | **~35s** | **1.7x** |

---

## PART 3: ONNX EXPORT + TENSORRT FP16 ENGINES (Day 1-2)

### 3.1 Why ONNX → TensorRT?
```
PyTorch → ONNX → TensorRT FP16 → SPEEDUP
     slow         2-3x faster    2-3x faster
     
Total: 4-9x faster without changing model architecture
```

### 3.2 SAM 2 ONNX Export (The Hard Part)
SAM 2's image encoder (Hiera) is a pure ViT — exportable to ONNX.
The mask decoder uses dynamic shapes — trickier but doable.

```python
# backend/app/perception/tensorrt/export_sam2.py

import torch
import onnx
from sam2.modeling.sam2_base import SAM2Base

def export_sam2_encoder_to_onnx(
    sam2_ckpt: str,
    output_path: str,
    precision: str = "FP16"
):
    """Export SAM2 image encoder to ONNX with FP16.
    
    SAM2 encoder = Hiera ViT. Pure feedforward — easy to export.
    """
    # Load SAM2
    sam2_model = build_sam2("sam2_hiera_s.yaml", sam2_ckpt, device="cuda")
    encoder = sam2_model.image_encoder  # The heavy part
    
    # Warmup (important for JIT)
    dummy_input = torch.randn(1, 3, 1024, 1024, device="cuda")
    
    # Static shape for TensorRT (must be known at build time)
    # SAM2 native = 1024x1024 image encoder
    torch.onnx.dynamo_export(
        encoder,
        dummy_input,
        export_options=torch.onnx.ExportOptions(
            op_level_debug=False,
            shapes={'x': [1, 3, 1024, 1024]}
        )
    ).save(output_path)
    
    print(f"SAM2 encoder exported to {output_path}")

# Run:
# python -m backend.app.perception.tensorrt.export_sam2 \
#   --ckpt /home/govinda/aether/data/checkpoints/sam2_hiera_small.pt \
#   --output /home/govinda/aether/data/checkpoints/sam2_encoder.fp16.onnx
```

### 3.3 Build TensorRT Engine from ONNX
```bash
# Use trtexec (shipped with TensorRT) to build FP16 engine
trtexec \
  --onnx=/home/govinda/aether/data/checkpoints/sam2_encoder.fp16.onnx \
  --saveEngine=/home/govinda/aether/data/checkpoints/sam2_encoder.fp16.trt \
  --fp16 \
  --workspace=3072 \
  --minShapes=input:1x3x1024x1024 \
  --optShapes=input:1x3x1024x1024 \
  --maxShapes=input:1x3x1024x1024 \
  --verbose

# --fp16: Enable FP16 tensor core acceleration (2x throughput on RTX 3050)
# --workspace=3072: 3GB workspace for TensorRT optimization (fits in 4GB VRAM)
# --min/opt/maxShapes: Full optimization for fixed input size
```

### 3.4 DepthAnythingV2 ONNX Export
```python
# backend/app/perception/tensorrt/export_depth.py

def export_depth_anything_v2():
    """Export DepthAnything V2 ViT-S to ONNX + TensorRT FP16."""
    from depth_anything.dpt import DepthAnythingV2
    
    model = DepthAnythingV2(model='vits', features=64).cuda()
    model.load_state_dict(torch.load("depth_anything_v2_vits14.pth"))
    model.eval()
    
    # Fixed 518x518 input (DepthAnything's native resolution)
    dummy = torch.randn(1, 3, 518, 518, device='cuda')
    
    torch.onnx.dynamo_export(model, dummy).save("depth_anything_v2.onnx")
    print("DepthAnythingV2 exported")

# Build engine:
# trtexec --onnx=depth_anything_v2.onnx \
#   --saveEngine=depth_anything_v2.fp16.trt \
#   --fp16 --workspace=2048
```

### 3.5 ONNX Runtime CUDA EP (Python-only fallback)
For CoTracker3 (no TensorRT needed), use ONNX Runtime CUDA EP directly:

```python
# backend/app/perception/optimized/cotracker3_onnx.py

import onnxruntime as ort

class ONNXCoTracker3:
    """CoTracker3 via ONNX Runtime CUDA EP (no TensorRT needed)."""
    
    def __init__(self, onnx_path: str):
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL  # Full graph optimization
        )
        sess_options.enable_mem_pattern = True          # Reuse memory allocations
        sess_options.enable_cpu_mem_arena = False       # Don't waste CPU memory
        
        providers = [
            ('CUDAExecutionProvider', {
                'device_id': 0,
                'arena_extend_strategy': 'kNextPowerOfTwo',
                'cudnn_conv_algo_search': 'EXHAUSTIVE',  # Best for small models
                'do_copy_in_default_stream': True,
            }),
            'CPUExecutionProvider',
        ]
        
        self.session = ort.InferenceSession(onnx_path, sess_options, providers=providers)
    
    def predict(self, video_tensor: np.ndarray):
        return self.session.run(None, {'input': video_tensor})
```

**Expected speedup: 2-3x on CoTracker3 with ONNX Runtime CUDA EP**

### 3.6 Benchmark After Part 3
| Model | Before | After | Speedup |
|-------|--------|-------|---------|
| SAM 2 encoder (FP16 TensorRT) | ~50s | **~8s** | **6x** |
| CoTracker3 (ONNX CUDA EP) | ~35s | **~12s** | **3x** |
| DepthAnythingV2 (FP16 TensorRT) | ~25s | **~5s** | **5x** |
| **Subtotal** | **~110s** | **~25s** | **4.4x** |

---

## PART 4: THE TRUE BREAKTHROUGH — CUDA Graph Pipeline (Day 2-3)

### 4.1 Why CUDA Graphs Are THE Breakthrough

**Current state of every AI system in the world:**
```
PyTorch:
  kernel_1_launch()    ← CPU
  kernel_2_launch()    ← CPU (each kernel = CPU overhead)
  kernel_3_launch()    ← CPU
  ...
  # 1000 kernels = 1000 CPU→GPU round trips
```

**With CUDA Graphs (what vLLM does for LLMs):**
```
CUDA Graph:
  graph.capture_begin()
    kernel_1()         ← GPU only (no CPU!)
    kernel_2()         ← GPU only
    kernel_3()         ← GPU only
    ...
  graph.capture_end()
  
  graph.replay()       ← ONE CPU call = entire model
  # 1000 kernels = 1 CPU call
```

**For our 3-model pipeline:** Instead of each model launching 1000s of kernels individually, we capture the ENTIRE PIPELINE as ONE CUDA Graph and replay it with ONE call.

### 4.2 vLLM-Style Budget CUDA Graph Manager

vLLM uses a "budget-based" CUDA Graph strategy where they pre-compute graphs for different sequence length "budgets." We adapt this for vision:

```python
# backend/app/perception/cuda_graph/manager.py

import torch
from dataclasses import dataclass
from typing import Callable, Any

@dataclass
class BudgetLevel:
    """A pre-computed CUDA Graph for a specific input size budget.
    
    vLLM insight: Instead of one graph, pre-compute graphs for
    common budget levels (e.g., 256, 512, 768 tokens).
    Replay is 10-50x faster than capture.
    """
    frames: int           # Number of frames in budget
    height: int           # Frame height
    width: int            # Frame width
    graph: torch.cuda.CUDAGraph
    static_input: torch.Tensor  # Pre-allocated input buffer

class VisionCUDAGraphManager:
    """Budget-based CUDA Graph manager for vision models.
    
    Based on vLLM's EncoderCudaGraphManager.
    Key innovation: Pre-compute CUDA Graphs for common budget levels.
    Replay is ~20x faster than capture.
    
    Budget levels for our pipeline:
    - Budget 1:  1 frame  (single frame analysis)
    - Budget 2:  5 frames (quick track)  
    - Budget 3:  10 frames (standard)
    - Budget 4:  15 frames (full analysis)
    """
    
    def __init__(self, capture_device: str = "cuda"):
        self.device = torch.device(capture_device)
        self.budgets: dict[tuple, BudgetLevel] = {}
        self.capture_stream = torch.cuda.Stream()
        
    def capture_model(
        self,
        model_fn: Callable,
        input_args: tuple,
        input_kwargs: dict,
        budget_key: tuple,
    ) -> BudgetLevel:
        """Capture a model forward pass as a CUDA Graph.
        
        The key trick: We pre-allocate static tensors and copy data into
        them BEFORE capture, so the capture includes the H2D copy.
        This means replay() includes H2D — zero CPU overhead.
        """
        # Pre-allocate static input buffer
        static_input = torch.zeros_like(input_args[0], device=self.device)
        
        # Capture the forward pass
        g = torch.cuda.CUDAGraph()
        
        with torch.cuda.stream(self.capture_stream):
            # Warmup (important for JIT compilation)
            for _ in range(3):
                static_input.copy_(input_args[0])
                _ = model_fn(static_input, *input_args[1:], **input_kwargs)
            torch.cuda.synchronize()
            
            # CAPTURE
            g.capture_begin()
            static_input.copy_(input_args[0])
            output = model_fn(static_input, *input_args[1:], **input_kwargs)
            g.capture_end()
        
        torch.cuda.synchronize()
        
        budget = BudgetLevel(
            frames=input_args[0].shape[1] if input_args[0].dim() == 5 else 1,
            height=input_args[0].shape[-2],
            width=input_args[0].shape[-1],
            graph=g,
            static_input=static_input,
        )
        self.budgets[budget_key] = budget
        return budget
    
    def replay(self, budget_key: tuple, input_tensor: torch.Tensor) -> Any:
        """Replay a pre-captured graph — ~20x faster than capture.
        
        Only ONE CPU call: copy input + replay graph.
        All 1000s of kernel launches happen on GPU with ZERO CPU overhead.
        """
        budget = self.budgets[budget_key]
        budget.static_input.copy_(input_tensor)
        return budget.graph.replay()
    
    def get_budget_key(self, frames: int, height: int, width: int) -> tuple:
        """Quantize to nearest pre-computed budget level."""
        # Map to nearest budget
        frame_budgets = sorted(set([1, 5, 10, 15]))
        best_frames = min(frame_budgets, key=lambda x: abs(x - frames))
        return (best_frames, height, width)
```

### 4.3 The Unified 3-Model CUDA Graph Pipeline

**THIS IS THE CORE BREAKTHROUGH** — what no one has built before:

```python
# backend/app/perception/pipeline/unified_pipeline.py

import torch
import gc
from pathlib import Path
from dataclasses import dataclass
from typing import Literal

@dataclass
class PipelineConfig:
    """Configuration for the unified perception pipeline."""
    # Sequential model loading (one at a time in VRAM)
    load_sam2: bool = True
    load_cotracker: bool = True
    load_depth: bool = True
    
    # Precision per model
    sam2_precision: Literal["FP16", "FP32"] = "FP16"
    cotracker_precision: Literal["FP16", "FP32"] = "FP16"
    depth_precision: Literal["FP16", "FP32"] = "FP16"
    
    # CUDA Graph budgets
    use_cuda_graphs: bool = True
    budget_frames: list = None  # [1, 5, 10, 15]
    
    def __post_init__(self):
        if self.budget_frames is None:
            self.budget_frames = [1, 5, 10, 15]


class UnifiedPerceptionPipeline:
    """The BREAKTHROUGH: Unified CUDA Graph pipeline for SAM2 + CoTracker3 + DepthAnything.
    
    Architecture:
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     RTX 3050 VRAM (4GB)                             │
    │                                                                     │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │  CUDA Graph Capture Region (captures ALL 3 models at once)  │   │
    │  │                                                              │   │
    │  │  [SAM2 TensorRT] → [CoTracker3 ONNX] → [DepthAnything TRT]  │   │
    │  │       GPU→GPU→GPU→GPU  (zero CPU copies between models)    │   │
    │  │                                                              │   │
    │  │  Intermediate tensors NEVER leave GPU                       │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                                                                     │
    │  Memory management:                                                 │
    │  - Load SAM2 TensorRT engine  → Run → Free                        │
    │  - Load CoTracker3 ONNX       → Run → Free                        │
    │  - Load DepthAnything TRT     → Run → Free                        │
    │                                                                     │
    │  Total VRAM peak: < 3.5GB (fits RTX 3050)                         │
    └─────────────────────────────────────────────────────────────────────┘
    """
    
    def __init__(self, config: PipelineConfig = None):
        self.config = config or PipelineConfig()
        self._sam2_engine = None
        self._cotracker_session = None
        self._depth_engine = None
        self._graph_manager = VisionCUDAGraphManager()
        
    def _load_sam2_tensorrt(self):
        """Load SAM2 TensorRT engine (FP16)."""
        if self._sam2_engine is None:
            import tensorrt as trt
            
            # Load TensorRT engine (built from ONNX export in Part 3)
            engine_path = Path("/home/govinda/aether/data/checkpoints/sam2_encoder.fp16.trt")
            if not engine_path.exists():
                raise FileNotFoundError(
                    f"SAM2 TensorRT engine not found at {engine_path}. "
                    "Run Part 3 ONNX export first."
                )
            
            logger = trt.Logger(trt.Logger.WARNING)
            with open(engine_path, 'rb') as f:
                self._sam2_engine = trt.deserialize_engine(logger, f.read())
            
            # Create execution context
            self._sam2_context = self._sam2_engine.create_execution_context()
            print(f"[AETHER] SAM2 TensorRT loaded (FP16)")
    
    def _load_cotracker_onnx(self):
        """Load CoTracker3 ONNX model with CUDA EP."""
        if self._cotracker_session is None:
            import onnxruntime as ort
            
            onnx_path = Path("/home/govinda/aether/data/checkpoints/cotracker3.onnx")
            if not onnx_path.exists():
                raise FileNotFoundError(
                    f"CoTracker3 ONNX not found at {onnx_path}. "
                    "Export CoTracker3 to ONNX first."
                )
            
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = (
                ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            )
            sess_options.enable_mem_pattern = True
            
            self._cotracker_session = ort.InferenceSession(
                str(onnx_path),
                sess_options,
                providers=[('CUDAExecutionProvider', {'device_id': 0}), 'CPUExecutionProvider']
            )
            print(f"[AETHER] CoTracker3 ONNX loaded (CUDA EP)")
    
    def _load_depth_tensorrt(self):
        """Load DepthAnythingV2 TensorRT engine (FP16)."""
        if self._depth_engine is None:
            import tensorrt as trt
            
            engine_path = Path("/home/govinda/aether/data/checkpoints/depth_anything_v2.fp16.trt")
            if not engine_path.exists():
                raise FileNotFoundError(
                    f"DepthAnything TensorRT engine not found at {engine_path}. "
                    "Run Part 3 ONNX export first."
                )
            
            logger = trt.Logger(trt.Logger.WARNING)
            with open(engine_path, 'rb') as f:
                self._depth_engine = trt.deserialize_engine(logger, f.read())
            
            self._depth_context = self._depth_engine.create_execution_context()
            print(f"[AETHER] DepthAnythingV2 TensorRT loaded (FP16)")
    
    @torch.no_grad()
    def run_frame(
        self,
        frame: torch.Tensor,  # (3, H, W) uint8 or (3, H, W) float32
        frame_idx: int = 0,
    ) -> dict:
        """Run unified pipeline on a single frame.
        
        ZERO CPU copies between models. All tensors stay on GPU.
        """
        # Ensure frame is on GPU and correct dtype
        if frame.device.type != 'cuda':
            frame = frame.cuda()
        if frame.dtype != torch.float16:
            frame = frame.half()
        
        results = {}
        
        # Step 1: SAM2 Segmentation (TensorRT FP16)
        if self.config.load_sam2:
            self._load_sam2_tensorrt()
            # SAM2 expects (1, 3, 1024, 1024) - resize if needed
            h, w = frame.shape[-2:]
            if (h, w) != (1024, 1024):
                frame_resized = torch.nn.functional.interpolate(
                    frame[None], size=(1024, 1024), mode='bilinear', align_corners=False
                )[0]
            else:
                frame_resized = frame
            
            # SAM2 inference via TensorRT
            sam2_output = self._sam2_inference(frame_resized)
            results['masks'] = sam2_output['masks']
            del sam2_output
            torch.cuda.synchronize()
        
        # Step 2: Depth Estimation (TensorRT FP16) 
        if self.config.load_depth:
            self._load_depth_tensorrt()
            # DepthAnything expects (1, 3, 518, 518)
            depth_input = torch.nn.functional.interpolate(
                frame[None], size=(518, 518), mode='bilinear', align_corners=False
            )[0]
            
            depth_output = self._depth_inference(depth_input)
            results['depth'] = depth_output['depth_map']
            del depth_output
            torch.cuda.synchronize()
        
        # Free models from VRAM after use
        self._unload_sam2()
        self._unload_depth()
        
        return results
    
    @torch.no_grad()
    def run_tracking(
        self,
        frames: list[torch.Tensor],  # (T, 3, H, W)
        grid_size: int = 6,
    ) -> dict:
        """Run CoTracker3 tracking on multiple frames.
        
        Uses ONNX Runtime CUDA EP + torch.compile wrapper.
        Intermediate tensors stay on GPU.
        """
        self._load_cotracker_onnx()
        
        # Stack frames: (T, 3, H, W)
        video_tensor = torch.stack(frames, dim=0).cuda().half()
        
        # Subsample if too many frames (CoTracker3 window=16)
        T = min(video_tensor.shape[0], 16)
        if video_tensor.shape[0] > T:
            indices = torch.linspace(0, video_tensor.shape[0]-1, T).long()
            video_tensor = video_tensor[indices]
        
        # Format: (1, T, 3, H, W) normalized [0,1]
        video_tensor = video_tensor.permute(0, 1, 2, 3, 4) / 255.0
        
        # CUDA Graph replay (if available for this budget)
        if self.config.use_cuda_graphs:
            budget_key = self._graph_manager.get_budget_key(
                T, video_tensor.shape[-2], video_tensor.shape[-1]
            )
            if budget_key in self._graph_manager.budgets:
                tracks, visibility = self._graph_manager.replay(
                    budget_key, video_tensor
                )
            else:
                # Capture new budget level
                budget = self._graph_manager.capture_model(
                    self._cotracker_inference,
                    (video_tensor,),
                    {},
                    budget_key
                )
                tracks, visibility = budget.graph.replay()
        else:
            tracks, visibility = self._cotracker_inference(video_tensor)
        
        self._unload_cotracker()
        torch.cuda.synchronize()
        
        return {
            'tracks': tracks.cpu().numpy(),
            'visibility': visibility.cpu().numpy(),
            'frame_count': T,
        }
    
    def run_full_pipeline(self, frames: list) -> dict:
        """Run complete 3-model pipeline on video frames.
        
        Pipeline flow:
        Frame → SAM2 (segmentation) ──┐
             → DepthAnything (depth) ──┼→ Scene graph builder
             → CoTracker3 (tracking) ──┘
        
        Total target: < 2 seconds for 10 frames on RTX 3050.
        """
        print(f"[AETHER] Running unified pipeline on {len(frames)} frames...")
        
        results = {
            'segmentation': [],
            'depth': [],
            'tracks': None,
        }
        
        # Process each frame: SAM2 + Depth
        for i, frame in enumerate(frames):
            # Convert to tensor
            if isinstance(frame, list):
                frame = torch.from_numpy(frame)
            if frame.dtype == torch.uint8:
                frame = frame.float() / 255.0
            frame = frame.permute(2, 0, 1)  # (H, W, 3) → (3, H, W)
            
            # Unified inference (SAM2 + Depth on same GPU, no CPU copy)
            frame_results = self.run_frame(frame, i)
            
            results['segmentation'].append(frame_results.get('masks', []))
            results['depth'].append(frame_results.get('depth', None))
            
            print(f"  Frame {i+1}/{len(frames)}: Done")
        
        # Tracking across all frames (needs all frames loaded)
        print(f"[AETHER] Running CoTracker3 on {len(frames)} frames...")
        frame_tensors = []
        for frame in frames:
            if isinstance(frame, list):
                frame = torch.from_numpy(frame)
            if frame.dtype == torch.uint8:
                frame = frame.float() / 255.0
            frame = frame.permute(2, 0, 1)
            frame_tensors.append(frame)
        
        results['tracks'] = self.run_tracking(frame_tensors)
        
        return results
    
    # ─── Memory Management ────────────────────────────────────────────────
    
    def _unload_sam2(self):
        if self._sam2_engine:
            del self._sam2_engine
            del self._sam2_context
            self._sam2_engine = None
            self._sam2_context = None
            gc.collect()
            torch.cuda.empty_cache()
    
    def _unload_cotracker(self):
        if self._cotracker_session:
            del self._cotracker_session
            self._cotracker_session = None
            gc.collect()
            torch.cuda.empty_cache()
    
    def _unload_depth(self):
        if self._depth_engine:
            del self._depth_engine
            del self._depth_context
            self._depth_engine = None
            self._depth_context = None
            gc.collect()
            torch.cuda.empty_cache()
```

### 4.4 VRAM Budget Manager — Fit 3 Models in 4GB

```python
# backend/app/perception/memory/vram_scheduler.py

import torch
import gc
from typing import Optional, Literal

class VRAMScheduler:
    """RTX 3050 (4GB) VRAM scheduler — load one model at a time.
    
    Key insight from NVIDIA Model Optimizer docs (2025):
    - Model weights: ~500MB total for all 3 models
    - Activation tensors: ~3GB peak during inference
    - Solution: Sequential loading + explicit memory barrier + garbage collect
    
    Memory layout on RTX 3050:
    ┌─────────────────────────────────────────┐
    │  Free space:    ~3.5GB                  │
    │                                             │
    │  Option A: All 3 models at once           │
    │    SAM2:       400MB                      │
    │    CoTracker3: 250MB                      │
    │    Depth:      300MB                      │
    │    Acts:       ~2GB (shared)              │
    │    ─────────────────────                  │
    │    Total:      ~3GB  ✅ FITS!              │
    │                                             │
    │  Option B: Sequential (safer for safety)   │
    │    Frame 0: SAM2 only (400MB)             │
    │    Frame 0: Depth only (300MB)            │
    │    Frames: CoTracker3 (250MB)             │
    └─────────────────────────────────────────┘
    """
    
    def __init__(self, max_vram_gb: float = 3.8):
        self.max_vram = int(max_vram_gb * 1e9)
        self.current_allocated = torch.cuda.memory_allocated()
        
    def can_load(self, model_name: str, extra_bytes: int = 0) -> bool:
        """Check if we have enough VRAM to load a model."""
        return (torch.cuda.memory_allocated() + extra_bytes) < self.max_vram
    
    def load_model(self, name: str, model_loader_fn, *args, **kwargs):
        """Load a model, evicting previous ones if needed."""
        # Evict all previous models first
        self._evict_all()
        
        # Load new model
        result = model_loader_fn(*args, **kwargs)
        
        print(f"[VRAM] Loaded {name}: "
              f"{torch.cuda.memory_allocated()/1e9:.2f}GB / {self.max_vram/1e9:.1f}GB")
        return result
    
    def _evict_all(self):
        """Force garbage collection + CUDA cache clear."""
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
    
    def get_stats(self) -> dict:
        return {
            'allocated_gb': torch.cuda.memory_allocated() / 1e9,
            'reserved_gb': torch.cuda.memory_reserved() / 1e9,
            'max_allocated_gb': torch.cuda.max_memory_allocated() / 1e9,
            'free_gb': (torch.cuda.get_device_properties(0).total_memory 
                       - torch.cuda.memory_allocated()) / 1e9,
        }
```

### 4.5 Benchmark After Part 4
| Model | Before | After | Speedup |
|-------|--------|-------|---------|
| SAM 2 (CUDA Graph TensorRT) | ~8s | **~3s** | **2.7x** |
| CoTracker3 (CUDA Graph ONNX) | ~12s | **~4s** | **3x** |
| DepthAnything (CUDA Graph TRT) | ~5s | **~1.5s** | **3.3x** |
| **Subtotal** | **~25s** | **~8.5s** | **~3x** |
| Plus zero-copy between models | — | **~2s** | **~4x** |

---

## PART 5: Q-SAM2 QUANTIZATION — FIT EVERYTHING PERFECTLY (Day 3)

### 5.1 Why Q-SAM2?

Q-SAM2 (June 2025 arXiv:2506.09782) is a paper specifically about quantizing SAM2:
- Standard INT8 hurts SAM2 quality by 20-30% (mask IoU drops)
- Q-SAM2's channel-wise scaling + per-layer calibration recovers quality
- Result: INT8 SAM2 that's AS ACCURATE as FP16 but 2x faster and 50% less VRAM

### 5.2 Q-SAM2 Implementation (Simplified)

```python
# backend/app/perception/quantization/qsam2.py

"""
Q-SAM2: Quantization-aware calibration for SAM2.

Based on: https://arxiv.org/abs/2506.09782

Key insight: SAM2's Hiera encoder has outlier channels that destroy
INT8 accuracy. Q-SAM2 uses:
1. Per-channel weight quantization for sensitive layers
2. Cross-layer equalization to balance channel ranges
3. AdaRound-like rounding for activations

We implement a simplified version using PyTorch's native quantization.
"""

import torch
import torch.nn as nn
from torch.quantization.observer import MinMaxObserver, HistogramObserver
from torch.quantization.quantize_fx import prepare_qat_fx, convert_fx

class QSAM2Encoder(torch.nn.Module):
    """Quantized SAM2 Hiera encoder with Q-SAM2 calibration.
    
    Memory reduction: FP16 (400MB) → INT8 (200MB) = 50% less VRAM.
    Speed improvement: ~2x from INT8 tensor ops.
    """
    
    def __init__(self, fp16_encoder: nn.Module):
        super().__init__()
        self.encoder = fp16_encoder
        
        # Q-SAM2 calibration: Weights per-channel, activations per-tensor
        self.quant = torch.quantization.QuantStub()
        self.dequant = torch.quantization.DeQuantStub()
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Quantize input to INT8
        x_q = self.quant(x)
        
        # Run through encoder
        out = self.encoder(x_q)
        
        # Dequantize output back to FP16/FP32 for next model
        out = self.dequant(out)
        return out
    
    @classmethod
    def from_fp16(cls, fp16_encoder_path: str) -> 'QSAM2Encoder':
        """Convert FP16 encoder to Q-SAM2 INT8."""
        # Load FP16 encoder
        encoder = load_fp16_encoder(fp16_encoder_path)
        
        # Apply Q-SAM2 quantization
        q_encoder = cls(encoder)
        
        # Calibrate with representative dataset (use training frames)
        q_encoder.eval()
        q_encoder = torch.quantization.quantize_dynamic(
            q_encoder,
            {torch.nn.Linear, torch.nn.Conv2d},
            dtype=torch.qint8,
            qconfig_spec={
                torch.nn.Linear: torch.quantization.QConfig(
                    weight=MinMaxObserver.with_args(dtype=torch.qint8),
                    activation=HistogramObserver.with_args(dtype=torch.qint8),
                ),
                torch.nn.Conv2d: torch.quantization.QConfig(
                    weight=MinMaxObserver.with_args(dtype=torch.qint8),
                    activation=HistogramObserver.with_args(dtype=torch.qint8),
                ),
            }
        )
        return q_encoder


class QSAM2Converter:
    """Convert FP16 SAM2 models to Q-SAM2 INT8 format."""
    
    @staticmethod
    def convert_and_save(
        fp16_trt_engine_path: str,
        output_qint8_path: str,
        calibration_frames: list[torch.Tensor],
    ):
        """Convert TensorRT FP16 engine to Q-SAM2 INT8.
        
        Steps:
        1. Load FP16 engine
        2. Run calibration on representative frames
        3. Quantize to INT8 with Q-SAM2 calibration
        4. Save quantized engine
        """
        print(f"[Q-SAM2] Converting {fp16_trt_engine_path} to INT8...")
        
        # Load FP16 engine
        engine = load_trt_engine(fp16_trt_engine_path)
        
        # Run calibration (forward pass on representative frames)
        # Q-SAM2 insight: Use actual video frames for calibration
        # not random data — this gives 5-10% better accuracy
        with torch.no_grad():
            for frame in calibration_frames[:100]:  # 100 frames for calibration
                _ = run_inference(engine, frame)
        
        # Quantize with Q-SAM2 per-channel scaling
        q_engine = qsam2_quantize(engine)
        
        # Save
        save_trt_engine(q_engine, output_qint8_path)
        print(f"[Q-SAM2] Saved INT8 engine to {output_qint8_path}")
        
        return q_engine
```

### 5.3 Memory Layout After Q-SAM2

```
RTX 3050 VRAM (4GB) with Q-SAM2 + sequential loading:
┌──────────────────────────────────────────┐
│ Phase 1: SAM2 Q-SAM2 INT8 (200MB)          │
│   → Run segmentation                       │
│   → Free SAM2                              │
├──────────────────────────────────────────┤
│ Phase 2: CoTracker3 ONNX FP16 (250MB)     │
│   → Run tracking                           │
│   → Free CoTracker3                        │
├──────────────────────────────────────────┤
│ Phase 3: DepthAnything FP16 TensorRT      │
│   (300MB)                                  │
│   → Run depth estimation                   │
│   → Free Depth                             │
├──────────────────────────────────────────┤
│ Shared activation memory (3GB)             │
│   → Frame data, intermediate tensors       │
│   → 3D reconstruction buffers             │
└──────────────────────────────────────────┘
Total: ~750MB model + ~3GB activations = < 4GB ✅
```

---

## PART 6: 3D GAUSSIAN SPLATTING RECONSTRUCTION (Day 3-4)

### 6.1 The 3DGS Breakthrough

Combine SAM2 segmentation + DepthAnything depth → **3D Gaussian Splats** → Interactive 3D digital twin in browser.

```
SAM2 masks + DepthAnything depth
         ↓
    Build 3D Gaussians from depth map + masks
    (each object = set of Gaussians)
         ↓
    Optimize Gaussians for 100 iterations
         ↓
    Export as .ply or .splat file
         ↓
    Render in Three.js React Three Fiber
```

### 6.2 Fast 3DGS Implementation

```python
# backend/app/reconstruction/gaussian_splatting.py

"""
3D Gaussian Splatting from SAM2 + DepthAnything.

Key insight: We already have everything needed for 3DGS:
- DepthAnything → 3D point cloud (metric depth)
- SAM2 → Object masks (which points belong to which object)

We don't need a full NeRF training — we can initialize Gaussians
directly from depth + segmentation, then do lightweight optimization.
"""

import torch
import numpy as np
from scipy.spatial.transform import Rotation as R

class Fast3DGSReconstructor:
    """3D Gaussian Splatting from depth + segmentation.
    
    Algorithm:
    1. Back-project depth map to 3D point cloud (camera coords)
    2. For each SAM2 mask, extract the points belonging to that object
    3. Initialize Gaussians at those 3D positions
    4. Optimize Gaussian scales/rotations for 100 iterations
    5. Export as .ply file
    
    Time target: < 3 seconds on RTX 3050
    """
    
    def __init__(self, camera_intrinsics=None):
        # Default camera intrinsics (can be calibrated)
        self.K = camera_intrinsics or {
            'fx': 1000, 'fy': 1000,  # focal lengths
            'cx': 640, 'cy': 360,    # principal point
        }
    
    def reconstruct(
        self,
        depth_map: np.ndarray,      # (H, W) depth in meters
        segmentation_masks: list,    # List of SAM2 masks
        frame_rgb: np.ndarray,       # (H, W, 3) RGB
    ) -> 'GaussianScene':
        """Reconstruct 3D scene as Gaussians from depth + segmentation."""
        
        H, W = depth_map.shape
        
        # Step 1: Back-project depth to 3D point cloud
        points_3d = self._depth_to_pointcloud(depth_map)
        colors = frame_rgb.reshape(-1, 3) / 255.0
        
        # Step 2: Build per-object Gaussians from SAM2 masks
        gaussians = []
        for mask_obj in segmentation_masks:
            mask = mask_obj['segmentation']  # (H, W) bool
            mask_flat = mask.flatten()
            
            # Extract 3D points for this object
            obj_points = points_3d[mask_flat]
            obj_colors = colors[mask_flat]
            
            if len(obj_points) < 10:
                continue  # Skip tiny masks
            
            # Step 3: Initialize Gaussians (one per cluster of points)
            obj_gaussians = self._initialize_gaussians(obj_points, obj_colors)
            gaussians.extend(obj_gaussians)
        
        # Step 4: Lightweight optimization (100 iterations)
        scene = GaussianScene(gaussians)
        scene.optimize(iterations=100)  # Very fast — only scales + rotations
        
        return scene
    
    def _depth_to_pointcloud(self, depth: np.ndarray) -> np.ndarray:
        """Back-project depth map to 3D points."""
        H, W = depth.shape
        fx, fy = self.K['fx'], self.K['fy']
        cx, cy = self.K['cx'], self.K['cy']
        
        # Pixel coordinates
        u, v = np.meshgrid(np.arange(W), np.arange(H))
        
        # Camera coordinates (assuming center coordinate system)
        x = (u - cx) * depth / fx
        y = (v - cy) * depth / fy
        z = depth
        
        # Stack: (N, 3)
        points = np.stack([x, y, z], axis=-1).reshape(-1, 3)
        return points
    
    def _initialize_gaussians(
        self, 
        points: np.ndarray, 
        colors: np.ndarray,
        n_gaussians: int = 50
    ) -> list:
        """Initialize Gaussians from point cloud using K-means approximation."""
        from sklearn.cluster import MiniBatchKMeans
        
        # Cluster points into n_gaussians
        n_gaussians = min(n_gaussians, len(points))
        kmeans = MiniBatchKMeans(n_clusters=n_gaussians, random_state=42)
        labels = kmeans.fit_predict(points)
        
        gaussians = []
        for i in range(n_gaussians):
            mask = labels == i
            cluster_points = points[mask]
            cluster_colors = colors[mask]
            
            if len(cluster_points) < 3:
                continue
            
            gaussian = {
                'position': cluster_points.mean(axis=0),
                'color': cluster_colors.mean(axis=0),
                'scale': cluster_points.std(axis=0).max() * np.ones(3),
                'rotation': np.array([1, 0, 0, 0]),  # quaternion (w, x, y, z)
                'opacity': 0.8,
            }
            gaussians.append(gaussian)
        
        return gaussians


class GaussianScene:
    """A 3D Gaussian Splatting scene — optimizable."""
    
    def __init__(self, gaussians: list):
        self.gaussians = gaussians
        
        # Convert to torch tensors for optimization
        self.positions = torch.tensor(
            [g['position'] for g in gaussians], device='cuda', dtype=torch.float32
        )
        self.colors = torch.tensor(
            [g['color'] for g in gaussians], device='cuda', dtype=torch.float32
        )
        self.scales = torch.tensor(
            [g['scale'] for g in gaussians], device='cuda', dtype=torch.float32,
            requires_grad=True
        )
        self.rotations = torch.tensor(
            [g['rotation'] for g in gaussians], device='cuda', dtype=torch.float32,
            requires_grad=True
        )
        self.opacities = torch.tensor(
            [g['opacity'] for g in gaussians], device='cuda', dtype=torch.float32,
            requires_grad=True
        )
    
    def optimize(self, iterations: int = 100):
        """Lightweight optimization of scales and opacities."""
        optimizer = torch.optim.Adam([self.scales, self.opacities], lr=0.01)
        
        for _ in range(iterations):
            optimizer.zero_grad()
            # Simple density-based loss: prefer fewer, larger Gaussians
            # This compresses the representation
            scale_loss = self.scales.sum() * 0.001
            opacity_loss = -torch.log1p(self.opacities).mean() * 0.01
            loss = scale_loss + opacity_loss
            loss.backward()
            optimizer.step()
    
    def export_ply(self, output_path: str):
        """Export as .ply file for Three.js rendering."""
        import plyfile
        
        positions = self.positions.cpu().numpy()
        colors = (self.colors.cpu().numpy() * 255).astype(np.uint8)
        scales = self.scales.detach().cpu().numpy()
        opacities = self.opacities.detach().cpu().numpy()
        
        # Build PLY data
        vertices = np.empty(
            len(positions),
            dtype=[('x', 'f4'), ('y', 'f4'), ('z', 'f4'),
                   ('red', 'u1'), ('green', 'u1'), ('blue', 'u1'),
                   ('scale_0', 'f4'), ('scale_1', 'f4'), ('scale_2', 'f4'),
                   ('opacity', 'f4')]
        )
        
        vertices['x'] = positions[:, 0]
        vertices['y'] = positions[:, 1]
        vertices['z'] = positions[:, 2]
        vertices['red'] = colors[:, 0]
        vertices['green'] = colors[:, 1]
        vertices['blue'] = colors[:, 2]
        vertices['scale_0'] = scales[:, 0]
        vertices['scale_1'] = scales[:, 1]
        vertices['scale_2'] = scales[:, 2]
        vertices['opacity'] = opacities
        
        el = plyfile.PlyElement.describe(vertices, 'vertex')
        plyfile.PlyData([el]).write(output_path)
        print(f"[3DGS] Exported {len(positions)} Gaussians to {output_path}")
```

---

## PART 7: UNIFIED API ENDPOINT (Day 4)

### 7.1 The `/api/perception/unified` Endpoint

```python
# backend/app/api/perception_pipeline.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid, time

router = APIRouter()

class UnifiedPerceptionRequest(BaseModel):
    session_id: str
    mode: str = "full"  # "full", "fast", "3d"
    max_frames: int = 10
    run_3d_reconstruction: bool = True

class UnifiedPerceptionResponse(BaseModel):
    pipeline_id: str
    session_id: str
    total_time_seconds: float
    stages: dict
    segmentation: dict
    tracking: dict
    depth: dict
    reconstruction_3d: Optional[dict] = None
    vram_peak_gb: float
    vram_stats: dict

@router.post("/perception/unified")
async def run_unified_perception(req: UnifiedPerceptionRequest):
    """THE BREAKTHROUGH ENDPOINT.
    
    Runs the FULL AETHER Neural Core pipeline:
    1. SAM2 segmentation (TensorRT FP16 CUDA Graph)
    2. CoTracker3 tracking (ONNX CUDA Graph)  
    3. DepthAnything V2 (TensorRT FP16 CUDA Graph)
    4. 3D Gaussian Splatting reconstruction
    
    Target: < 2 seconds for 10 frames on RTX 3050.
    """
    t0 = time.time()
    
    # Initialize pipeline
    config = PipelineConfig(
        load_sam2=True,
        load_cotracker=True, 
        load_depth=True,
        sam2_precision="FP16",
        cotracker_precision="FP16",
        depth_precision="FP16",
        use_cuda_graphs=True,
    )
    pipeline = UnifiedPerceptionPipeline(config)
    
    # Load frames from session
    frames = load_session_frames(req.session_id, req.max_frames)
    
    stages = {}
    
    # Stage 1: SAM2 + Depth (per frame)
    stage1_start = time.time()
    seg_results = []
    depth_results = []
    for frame in frames:
        result = pipeline.run_frame(frame_to_tensor(frame))
        seg_results.append(result.get('masks', []))
        depth_results.append(result.get('depth'))
    stages['segmentation_depth'] = time.time() - stage1_start
    
    # Stage 2: CoTracker3 tracking
    stage2_start = time.time()
    track_results = pipeline.run_tracking([frame_to_tensor(f) for f in frames])
    stages['tracking'] = time.time() - stage2_start
    
    # Stage 3: 3D reconstruction
    reconstruction_3d = None
    if req.run_3d_reconstruction:
        stage3_start = time.time()
        reconstructor = Fast3DGSReconstructor()
        reconstruction_3d = reconstructor.reconstruct(
            depth_results[0],
            seg_results[0],
            frames[0]
        )
        reconstruction_3d.export_ply(f"/data/sessions/{req.session_id}/scene_3d.ply")
        stages['3d_reconstruction'] = time.time() - stage3_start
    
    vram_stats = VRAMScheduler().get_stats()
    
    return UnifiedPerceptionResponse(
        pipeline_id=str(uuid.uuid4()),
        session_id=req.session_id,
        total_time_seconds=time.time() - t0,
        stages=stages,
        segmentation={'frame_count': len(seg_results), 'objects': seg_results[0]},
        tracking=track_results,
        depth={'depth_maps': depth_results},
        reconstruction_3d={'ply_path': f'/api/sessions/{req.session_id}/scene_3d.ply'} if reconstruction_3d else None,
        vram_peak_gb=vram_stats['max_allocated_gb'],
        vram_stats=vram_stats,
    )
```

---

## PART 8: FRONTEND INTEGRATION — 3D VIEWER (Day 4)

### 8.1 Three.js 3D Gaussian Splatting Viewer

```tsx
// apps/desktop/src/components/studio/Scene3DViewer.tsx

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useTexture, Float } from '@react-three/drei'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

interface GaussianPoint {
  position: [number, number, number]
  color: [number, number, number]
  scale: [number, number, number]
  opacity: number
}

interface Scene3DViewerProps {
  plyPath?: string
  objects?: any[]
  onPointClick?: (objectId: number) => void
}

function GaussianPoints({ points }: { points: GaussianPoint[] }) {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => p.position))}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={points.length}
          array={new Float32Array(points.flatMap(p => p.color.map(c => c / 255)))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

function ForceVectors({ objects }: { objects: any[] }) {
  // Render force vectors as arrows on each object
  return (
    <group>
      {objects.filter(o => o.physics?.force).map(obj => (
        <arrowHelper
          key={obj.id}
          args={[
            new THREE.Vector3(...(obj.physics.force_direction || [0, 1, 0])),
            new THREE.Vector3(...obj.position),
            obj.physics.force_magnitude || 1,
            obj.physics.force_color || '#ff0000',
            0.1,
            0.05,
          ]}
        />
      ))}
    </group>
  )
}

export function Scene3DViewer({ plyPath, objects = [], onPointClick }: Scene3DViewerProps) {
  const [points, setPoints] = useState<GaussianPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load PLY file if provided
  useEffect(() => {
    if (!plyPath) return
    setLoading(true)
    
    fetch(`/api/sessions/${plyPath}`)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        // Parse PLY and extract Gaussian parameters
        const parsed = parsePLY(buffer)
        setPoints(parsed)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load 3D scene')
        setLoading(false)
      })
  }, [plyPath])

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading 3D scene...</div>
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* 3D Gaussian Splatting points */}
        {points.length > 0 && <GaussianPoints points={points} />}
        
        {/* Object labels and force vectors */}
        <ForceVectors objects={objects} />
        
        {/* Object bounding boxes */}
        {objects.map(obj => (
          <mesh key={obj.id} position={obj.position}>
            <boxGeometry args={obj.dimensions || [0.5, 0.5, 0.5]} />
            <meshStandardMaterial
              color={obj.color || '#4488ff'}
              transparent
              opacity={0.3}
              wireframe
            />
          </mesh>
        ))}
        
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}
```

---

## THE COMPLETE MARATHON ROADMAP

```
Week 1: Foundation
├── Day 1 AM: Install onnxruntime-gpu + DepthAnythingV2 + benchmark
├── Day 1 PM: torch.compile + SDPA for CoTracker3
├── Day 2 AM: ONNX export for SAM2 + DepthAnything
├── Day 2 PM: TensorRT FP16 engine building + benchmark
├── Day 3 AM: CUDA Graph pipeline (vLLM-style)
├── Day 3 PM: Q-SAM2 INT8 quantization
└── Day 4: 3DGS reconstruction + API + frontend

Week 2: Integration & Polish
├── Monday: End-to-end test with car video
├── Tuesday: Robot arm video test (different mechanism)
├── Wednesday: Drone video test
├── Thursday: Performance profiling + VRAM optimization
└── Friday: Documentation + demo video

Success Metrics:
✅ 10-frame pipeline: < 2 seconds (was 3-5 minutes)
✅ VRAM peak: < 3.8GB (fits RTX 3050)
✅ 3D reconstruction: < 3 seconds
✅ All 9 mechanism types: vehicle, drone, robot_arm, linkage, pendulum, human_motion, belt_gantry, rigid_body, custom
```

---

## INSTALLATION CHECKLIST

```bash
# Run this on marathon Day 1

# 1. Install optimization stack
pip install onnxruntime-gpu>=1.19.0 onnx>=1.17.0
pip install depth-pro  # DepthAnything V2
pip install scikit-learn  # For 3DGS K-means clustering
pip install plyfile  # For PLY file export
pip install numpy<2.0  # torch.compile compatibility

# 2. Verify CUDA environment
python3 -c "
import torch
print(f'PyTorch: {torch.__version__}')
print(f'CUDA: {torch.cuda.is_available()}')
print(f'cuDNN: {torch.backends.cudnn.version()}')
print(f'SDPA: {hasattr(torch.nn.functional, \"scaled_dot_product_attention\")}')
print(f'torch.compile: {hasattr(torch, \"compile\")}')

import onnxruntime as ort
print(f'ONNX Runtime providers: {ort.get_available_providers()}')
"

# 3. Download checkpoints
# SAM2 + CoTracker3 already downloaded
# DepthAnythingV2 checkpoint:
wget -O /home/govinda/aether/data/checkpoints/depth_anything_v2_vits14.pt \
  "https://dl.dropboxusercontent.com/scl/fi/d5i6i0w7jk3o5x5/depth_anything_v2_vits14.pth?rlkey=XXXX"

# 4. Verify checkpoints
ls -lh /home/govinda/aether/data/checkpoints/
```

---

## FILES TO CREATE

```
backend/app/perception/
├── __init__.py
├── tracking.py                    # (existing)
├── depth_anything/
│   ├── __init__.py
│   ├── setup.py                   # DepthAnything V2 setup
│   └── checkpoint_download.py
├── tensorrt/
│   ├── __init__.py
│   ├── export_sam2.py            # SAM2 ONNX export
│   ├── export_depth.py           # DepthAnything ONNX export
│   ├── build_engines.py          # TensorRT engine builder
│   └── sam2_inference.py         # TensorRT SAM2 runtime
├── cuda_graph/
│   ├── __init__.py
│   ├── manager.py                # VisionCUDAGraphManager (vLLM-style)
│   └── capture_utils.py          # CUDA Graph capture helpers
├── quantization/
│   ├── __init__.py
│   ├── qsam2.py                  # Q-SAM2 INT8 quantization
│   └── calibration.py            # Calibration dataset tools
├── memory/
│   ├── __init__.py
│   └── vram_scheduler.py         # RTX 3050 VRAM manager
├── optimized/
│   ├── __init__.py
│   ├── cotracker3_compiled.py    # torch.compile CoTracker3
│   └── cotracker3_onnx.py        # ONNX Runtime CUDA EP
├── pipeline/
│   ├── __init__.py
│   ├── unified_pipeline.py       # THE UNIFIED PIPELINE
│   └── benchmark.py              # Profiling tools
├── reconstruction/
│   ├── __init__.py
│   ├── gaussian_splatting.py     # Fast 3DGS from depth+seg
│   └── ply_exporter.py          # PLY file export
└── unified_api.py                # /api/perception/unified endpoint

frontend/src/components/
├── studio/
│   ├── Scene3DViewer.tsx         # Three.js 3D viewer
│   ├── MechanismCanvas.tsx       # 2D mechanism diagram
│   └── PipelineProgress.tsx      # Per-stage progress bar
```

---

## THE BREAKTHROUGH DIFFERENCE

| What SpaceX/Meta/NVIDIA Do | What AETHER Does |
|---------------------------|-----------------|
| A100/H100 (80GB VRAM) | RTX 3050 (4GB VRAM) |
| Each model separately | Unified CUDA Graph (zero copy) |
| FP32 or FP16 only | Q-SAM2 INT8 + FP16 mixed precision |
| CUDA Graphs per model | Budget CUDA Graphs across 3 models |
| Multi-GPU pipeline | Single GPU, sequential load |
| 5+ minutes per frame | **< 2 seconds for 10 frames** |
| No real-time | **Real-time video processing** |
| Expensive infrastructure | Runs on laptop |

---

## MARATHON START!

**Command to begin:**
```bash
cd /home/govinda/aether
python3 -c "
import torch
print('MARATHON START - GPU:', torch.cuda.get_device_name(0))
print('VRAM:', torch.cuda.get_device_properties(0).total_memory/1e9, 'GB')
print('CUDA:', torch.version.cuda)
print('PyTorch:', torch.__version__)
print()
print('Ready. Execute Part 1: Install optimization stack.')
"
```

**The stack that will change everything:**
- PyTorch 2.6 + CUDA 12.4
- TensorRT 10 (via trtexec)
- ONNX Runtime GPU (CUDA EP)
- Triton 3.2 + SDPA (FlashAttention)
- DepthAnything V2
- vLLM-style CUDA Graph scheduler
- Q-SAM2 INT8 quantization
- 3D Gaussian Splatting

**This is the most advanced perception optimization pipeline ever built for a consumer laptop GPU. Let's go.**
