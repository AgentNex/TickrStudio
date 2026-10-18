# Recipe DSL Format Specification — `[RECIPE]`

## Overview

The `[RECIPE]` Domain Specific Language (DSL) is an AI-friendly, human-readable scene description format. It compiles bidirectionally to the canonical `TimelineProject` JSON schema.

---

## Grammar & Syntax

A recipe document begins with `[RECIPE]` and terminates with `[/RECIPE]`.

```text
[RECIPE]
canvas: <width>x<height>
fps: <number>
duration: <number>ms | <number>s
background: <hex-color>

<objectType> <objectName>:
  <property>: <value>
  <animatedProperty>:
    <timestamp>ms: <value> [(<easing>)]
[/RECIPE]
```

### Global Settings
- `canvas`: Composition dimensions in pixels, formatted as `WIDTHxHEIGHT` (e.g. `1920x1080`, `1080x1920`, `1080x1080`). Range: 100 to 7680 px.
- `fps`: Composition framerate (e.g. `24`, `30`, `60`). Range: 1 to 120.
- `duration`: Total sequence length (e.g. `4000ms` or `4.0s`). Minimum: 100ms.
- `background`: Hex color string (e.g. `#0A0A0B`).

---

## Supported Object Types & Properties

### 1. `text`
- `content`: Displayed string in double quotes (e.g. `"Make it move."`).
- `x`, `y`: Anchor coordinates in scene space.
- `fontSize`: Typography size in pixels (e.g. `56`).
- `fill`: Hex or CSS color string (e.g. `#F5F5F0`).
- `align`: `'left'`, `'center'`, or `'right'`.

### 2. `rect`
- `width`, `height`: Rectangle bounding dimensions.
- `fill`: Interior fill color.
- `stroke`: Optional border outline color.
- `strokeWidth`: Outline width in pixels.
- `cornerRadius`: Border radius in pixels.

### 3. `ellipse`
- `radiusX`, `radiusY`: Ellipse radiuses in pixels.
- `fill`: Interior fill color.
- `stroke`: Optional border outline color.
- `strokeWidth`: Outline width in pixels.

---

## Keyframe Animation Syntax

Any numeric or color property can be keyframed by declaring it as a block with nested timestamps:

```text
rect card:
  x: 960
  y: 540
  width: 400
  height: 200
  fill: #19191C
  stroke: #D6D3C9
  scaleX:
    0ms: 0.5 (easeIn)
    800ms: 1.0 (easeOut)
  opacity:
    0ms: 0 (linear)
    500ms: 1 (linear)
```

### Supported Easings
- `linear`: Constant speed interpolation.
- `easeIn`: Accelerates into the target value (cubic bezier curve).
- `easeOut`: Decelerates smoothly into the target value.
- `easeInOut`: Gentle acceleration and deceleration.

---

## Security Invariants
1. **Zero `eval`**: The parser uses deterministic string parsing and regular expressions.
2. **Zero Code Execution**: Dynamic imports, function constructors, and executable JavaScript within recipes are strictly prohibited.
3. **Range Bound Validation**: All numeric values and timestamps are validated against canvas bounds and project duration before applying.
