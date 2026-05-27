# Screen Recording Guide for AETHER Demo

## Recording Environment Setup

### Display Settings

| Setting | Value |
|---------|-------|
| Resolution | 1920x1080 or 2560x1440 |
| Scaling | 100% (native) |
| Refresh Rate | 60Hz |
| Color Profile | sRGB or Display P3 |

**Critical:** Set your display scaling to 100% - UI elements at 125% or 150% scaling appear pixelated and unprofessional in recordings.

### Background

- Use a clean, dark background (IDE-like)
- Recommended: Solid dark gray (#1a1a1a) or subtle gradient
- Remove desktop icons, dock auto-hide enabled
- Disable notifications before recording

---

## Recording Software Recommendations

### macOS
- **QuickTime Player** (File → New Screen Recording) - Free, built-in
- **OBS Studio** - Free, more control, better for multi-source
- **CleanShot X** - Paid ($29), best for polished demos, has built-in annotations

### Windows
- **OBS Studio** - Free, industry standard
- **Xbox Game Bar** (Win+G) - Free, quick access
- **Camtasia** - Paid, full editing suite

### Linux
- **OBS Studio** - Free
- **Kooha** - Simple screen recorder, flatpak available
- **vv庄严** - Wayland-compatible

### Cross-Platform
- **ScreenStudio** - Free, good for dual monitor

---

## Hardware Recommendations

For professional quality:
- **Microphone:** Yeti USB mic or AirPods Pro (second generation) - avoid built-in laptop mic
- **Camera:** If recording webcam overlay: Logitech Brio 4K or iPhone as webcam
- **Lighting:** Simple ring light or softbox for any human presence

---

## Recording Checklist

Before each take, verify:

- [ ] Display set to 100% scaling
- [ ] Notifications disabled
- [ ] Browser only has AETHER tab open
- [ ] No background applications running
- [ ] Microphone levels tested (-12dB to -6dB range)
- [ ] Audio monitoring enabled (headphones to avoid feedback)
- [ ] Clock/time display hidden or obscured

---

## Step-by-Step Recording Sequence

### Phase 1: Clean UI Shots (No Cursor) - 15 minutes

Record these clips with no cursor movement - they serve as B-roll:

**1.1 - Upload Zone Idle**
```
Action: Show the upload zone with no file
Duration: 3-5 seconds
Notes: This is a safety shot in case upload fails
```

**1.2 - File Selection Dialog**
```
Action: Navigate to ~/Downloads or demo videos folder
Duration: 5 seconds
Notes: Make sure demo video file is pre-selected
```

**1.3 - Pipeline Running**
```
Action: Record 20-30 seconds of pipeline animation
Duration: 25 seconds (includes partial and complete)
Notes: Record full run - use this in editing
```

**1.4 - Results Display**
```
Action: Pan slowly across the results panel
Duration: 10 seconds
Notes: Record multiple angles if using different parameter displays
```

**1.5 - What-If Lab Slider Interaction**
```
Action: Drag mass slider from low to high
Duration: 15 seconds
Notes: Record full range, multiple speeds
```

### Phase 2: Full Demo Run - 20 minutes

Record 3-5 complete takes of the full demo:

**Pre-roll (3 seconds):** Black screen, count from 3 in your head

**Full Take:**
```
Timecode  Purpose
0:00-0:05 Black screen lead-in
0:05-0:15 Scene 1: Mechanism video plays (cursor hidden)
0:15-0:25 Scene 2: Problem montage (cursor optional)
0:25-0:35 Scene 3: Upload interaction (cursor visible, deliberate)
0:35-1:15 Scene 4: Pipeline visualization (cursor hidden)
1:15-1:30 Scene 5: Results reveal (cursor optional)
1:30-1:45 Scene 6: What-If Lab interaction (cursor visible)
1:45-2:00 Scene 7: Logo/closer (cursor hidden)
```

**Take Recovery:** After each take, note which parts felt right. Re-record only problematic sections.

### Phase 3: Pick-Up Shots - 10 minutes

Re-record any sections that didn't work. Common needs:
- Upload success confirmation
- Specific parameter reveal
- Slider interaction at particular value

---

## Cursor Recording Guidelines

### Cursor Visibility
- Use a consistent cursor size throughout
- Recommended: macOS cursor at default size
- For Windows: Use Windhawk or PowerToys to enlarge cursor

### Cursor Movement
- Deliberate, not frantic
- Hover on UI elements for 0.5s before clicking
- Click with subtle pause after click (0.2s minimum)
- Drag operations should be smooth, not jerky

### Cursor Trail Effect
**Do NOT use cursor trails** - they look dated and unprofessional

---

## Professional Tips

### Timing
- Record at 60fps even if delivering at 30fps - allows speed adjustment in post
- Record 10% longer than needed, trim in editing
- Pause 2 seconds before each cursor action

### Avoiding Mistakes
- Write exact click targets on paper: "Click 'Upload Zone' center-left"
- Have a second person watch while you record for real-time feedback
- Do a "dry run" immediately before recording

### Audio
- Record room tone (5 seconds of silence) at start for noise reduction
- Keep consistent distance from mic
- Avoid recording near HVAC or fan noise

### Performance
- Close all browser tabs except AETHER
- Disable browser extensions
- Use incognito/private mode for consistent browser state
- Disable hardware acceleration in Chrome if experiencing stutter

---

## Editing Notes

### Recommended Software
- **DaVinci Resolve** (free) - Professional grade, color grading
- **Adobe Premiere** - Industry standard
- **Final Cut Pro** (macOS only) - Fast, efficient
- **CapCut** (free, desktop) - Good for quick social cuts

### Edit Checklist
- [ ] Remove any accidental cursor wobble
- [ ] Sync voiceover to video precisely
- [ ] Add subtle sound design (whoosh for transitions, confirmation beeps)
- [ ] Color grade for consistency
- [ ] Add lower thirds if showing any names/titles
- [ ] Export at proper bitrate (20-50Mbps for 1080p)

### Export Settings
| Platform | Resolution | Bitrate | Format |
|----------|------------|---------|--------|
| YouTube | 1920x1080 | 20Mbps | H.264 |
| Twitter/X | 1920x1080 | 12Mbps | H.264 |
| LinkedIn | 1920x1080 | 8Mbps | H.264 |
| Instagram Reels | 1080x1920 | 8Mbps | H.264 |

---

## Backup Plan

Always record with backup:
1. Primary: Screen recording software
2. Secondary: Phone on tripod recording the monitor directly
3. Tertiary: Have a teammate watch live, take notes on timing

If upload fails during recording: Pause, restart pipeline, continue recording from that point. Edit later to remove restart.
