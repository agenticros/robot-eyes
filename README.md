# robot-eyes

Fullscreen robot eyes for an Ubuntu tablet, driven by ROS 2 `/cmd_vel` (`geometry_msgs/Twist`).

- Black background, landscape-friendly canvas
- Idle: occasional blinks and subtle look-around
- Turning left (`angular.z > 0`) → eyes look **right**; turning right → look **left**
- Recenters when not turning / when `/cmd_vel` stops
- Keyboard teleop (no on-screen overlays): **WASD** drive, **Q** faster, **Z** slower

## Requirements

- Node.js 18+
- ROS 2 Jazzy
- A graphical display (`DISPLAY`, usually `:0`)
- A browser for kiosk mode (Firefox or Chromium)

## Setup (once)

```bash
source /opt/ros/jazzy/setup.bash
cd ~/Projects/robot-eyes
npm install
```

## How to run

1. Source ROS and start the app:

```bash
source /opt/ros/jazzy/setup.bash
cd ~/Projects/robot-eyes
npm start
```

2. The app will:
   - Start ROS node `/robot_eyes` (subscribes + publishes `/cmd_vel`)
   - Serve the UI at [http://127.0.0.1:8765/](http://127.0.0.1:8765/)
   - Open a kiosk browser on the tablet display

3. With the eyes window focused, drive with the keyboard (see below). Eye gaze follows turn commands on `/cmd_vel`.

### Keyboard teleop

Focus must be on the eyes browser window (click it once if needed). Nothing extra is drawn on screen.

| Key | Action |
|-----|--------|
| `W` | Forward |
| `S` | Backward |
| `A` | Turn left |
| `D` | Turn right |
| `Q` | Increase speed |
| `Z` | Decrease speed |

Keys can be combined (e.g. `W`+`A`). Releasing all movement keys publishes a zero Twist. Speed changes are logged in the terminal only.

### Run without opening a browser

```bash
source /opt/ros/jazzy/setup.bash
cd ~/Projects/robot-eyes
npm run start:no-browser
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/) and press `F` (or click) for fullscreen.

### Stop

In the terminal where it’s running, press `Ctrl+C`, or:

```bash
pkill -f 'node src/index.js'
```

## Quick gaze test

In another terminal:

```bash
source /opt/ros/jazzy/setup.bash

# Eyes look right (left turn command)
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{angular: {z: 0.5}}" -r 10

# Eyes look left (right turn command)
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{angular: {z: -0.5}}" -r 10
```

Stop publishing (Ctrl+C) to recenter.

## Config (optional env vars)

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `8765` | HTTP / WebSocket port |
| `CMD_VEL_TOPIC` | `/cmd_vel` | Twist topic |
| `ANGULAR_DEADZONE` | `0.05` | Ignore small `angular.z` for gaze |
| `CMD_TIMEOUT_MS` | `300` | Recenter if no cmd for this long (ms) |
| `TELOP_LINEAR` | `0.25` | Base forward speed (m/s) at scale 1 |
| `TELOP_ANGULAR` | `0.9` | Base turn speed (rad/s) at scale 1 |
| `TELOP_SCALE_STEP` | `0.15` | Q/Z scale change per press |
| `TELOP_SCALE_MIN` | `0.2` | Minimum speed scale |
| `TELOP_SCALE_MAX` | `3` | Maximum speed scale |
| `TELOP_RATE_HZ` | `20` | `/cmd_vel` publish rate while driving |
| `BROWSER` | auto-detect | Browser binary for kiosk (`firefox`, `chromium`, …) |
| `DISPLAY` | `:0` | X display used when launching the browser |

Example:

```bash
TELOP_LINEAR=0.35 TELOP_ANGULAR=1.0 npm start
```
