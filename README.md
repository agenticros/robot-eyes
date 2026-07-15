# robot-eyes

Fullscreen robot eyes for an Ubuntu tablet, driven by ROS 2 `/cmd_vel` (`geometry_msgs/Twist`).

- Black background, landscape-friendly canvas
- Idle: occasional blinks and subtle look-around
- Turning left (`angular.z > 0`) → eyes look left; turning right → look right
- Recenters when not turning / when cmd_vel stops

## Requirements

- Node.js 18+
- ROS 2 Jazzy (sourced)
- A display browser (`firefox` is present on this machine; Chromium also works)

## Setup

```bash
source /opt/ros/jazzy/setup.bash
cd ~/Projects/robot-eyes
npm install
```

## Run

```bash
source /opt/ros/jazzy/setup.bash
npm start
```

This starts the ROS node + local UI server and opens a kiosk browser at `http://127.0.0.1:8765/`.

Without auto-opening a browser:

```bash
npm run start:no-browser
```

Then open the URL and press `F` for fullscreen (or click the page).

## Test gaze

```bash
# Look left
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{angular: {z: 0.5}}" -r 10

# Look right
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{angular: {z: -0.5}}" -r 10
```

Stop publishing to recenter.

## Config (env)

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `8765` | HTTP/WebSocket port |
| `CMD_VEL_TOPIC` | `/cmd_vel` | Twist topic |
| `ANGULAR_DEADZONE` | `0.05` | Ignore small angular.z |
| `CMD_TIMEOUT_MS` | `300` | Recenter if no cmd for this long |
| `BROWSER` | auto | Override browser binary |
| `DISPLAY` | `:0` | X display for kiosk launch |
