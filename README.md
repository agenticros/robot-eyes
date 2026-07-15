# robot-eyes

Fullscreen robot eyes for an Ubuntu tablet, driven by ROS 2 `/cmd_vel` (`geometry_msgs/Twist`).

- Black background, landscape-friendly canvas
- Idle: occasional blinks and subtle look-around
- Turning left (`angular.z > 0`) → eyes look **right**; turning right → look **left**
- Recenters when not turning / when `/cmd_vel` stops

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
   - Start ROS node `/robot_eyes` subscribed to `/cmd_vel`
   - Serve the UI at [http://127.0.0.1:8765/](http://127.0.0.1:8765/)
   - Open a kiosk browser on the tablet display

3. Drive the robot as usual (teleop / robotics.dev). Eye gaze follows turn direction from `/cmd_vel`.

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
| `ANGULAR_DEADZONE` | `0.05` | Ignore small `angular.z` |
| `CMD_TIMEOUT_MS` | `300` | Recenter if no cmd for this long (ms) |
| `BROWSER` | auto-detect | Browser binary for kiosk (`firefox`, `chromium`, …) |
| `DISPLAY` | `:0` | X display used when launching the browser |

Example:

```bash
PORT=9000 BROWSER=firefox npm start
```
