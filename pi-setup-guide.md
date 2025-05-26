# Raspberry Pi 5 Setup Guide for Yohan AI System

This guide provides step-by-step instructions to prepare your Raspberry Pi 5 for deploying the Yohan AI System.

## 1. Operating System Installation

**Note for Existing Setups:** If you, like the primary developer, already have Raspberry Pi OS (64-bit) installed and running (e.g., on an NVMe SSD via a HAT for improved performance and reliability), you can skip directly to Section 2: Initial System Configuration. The steps below are for a fresh OS installation.

1.  **Download Raspberry Pi Imager:** Get the latest version from the official Raspberry Pi website ([https://www.raspberrypi.com/software/](https://www.raspberrypi.com/software/)).
2.  **Choose an OS:** Select "Raspberry Pi OS (64-bit)" recommended for Raspberry Pi 5. A desktop version is advisable if you plan to use a directly connected touchscreen and for easier initial setup.
3.  **Write to Boot Medium:**
    *   **For NVMe SSD (Recommended for Yohan):** If you are using an NVMe SSD with a compatible HAT, ensure your Raspberry Pi 5 firmware is up to date to support NVMe boot. You might need to initially boot from an SD card to configure the Pi to boot from NVMe. Refer to your HAT manufacturer's instructions and official Raspberry Pi documentation for setting up NVMe boot.
    *   **For SD Card:** Use Raspberry Pi Imager to write the OS to a high-quality microSD card (at least 32GB, Class 10/U1 or faster is recommended).
    *   **Pre-configuration (Optional but Recommended via Imager):** Before writing, click the gear icon in Raspberry Pi Imager to pre-configure:
        *   Hostname (e.g., `yohan-pi`)
        *   Enable SSH (set a username and password - do not use the default `pi` if possible, or change it immediately after first boot).
        *   Configure Wi-Fi (SSID and password).
        *   Set locale and keyboard layout.
4.  **First Boot:** Insert your chosen boot medium (NVMe SSD connected via HAT, or SD card) into the Raspberry Pi 5, connect peripherals (keyboard, mouse, monitor, power supply), and boot it up.

## 2. Initial System Configuration

1.  **Connect to Network:** If not pre-configured, connect to your Wi-Fi or Ethernet network.
2.  **Open a Terminal:** Either directly on the Pi or via SSH from another computer (`ssh your_username@yohan-pi.local` or `ssh your_username@<IP_ADDRESS_OF_PI>`).
3.  **Update System:** It's crucial to start with an up-to-date system.
    ```bash
    sudo apt update
    sudo apt full-upgrade -y
    ```
4.  **Change Default Password (if not done via Imager or if using default user `pi`):
    ```bash
    passwd
    ```
5.  **Configure Raspberry Pi Settings (Optional, if not done via Imager or need changes):
    ```bash
    sudo raspi-config
    ```
    *   **Display Options:** Configure resolution if needed.
    *   **Interface Options:** Ensure SPI and I2C are enabled if you plan to use hardware that requires them (e.g., some specific touchscreens or sensors, though not explicitly in the current Yohan plan).
    *   **Localization Options:** Set Timezone, Locale, Keyboard Layout if not correct.
    *   **Advanced Options:** Expand Filesystem (usually done automatically now).
6.  **Reboot (if necessary after updates or config changes):
    ```bash
    sudo reboot
    ```

## 3. Install Essential Software & Dependencies

1.  **Install Git:** For cloning the Yohan project repository.
    ```bash
    sudo apt install git -y
    ```
2.  **Verify Python Installation:** Raspberry Pi OS comes with Python pre-installed. Verify the version (Yohan aims for Python 3.9+).
    ```bash
    python3 --version
    pip3 --version
    ```
3.  **Install Python Build Essentials & Virtual Environment Tools:**
    ```bash
    sudo apt install python3-dev python3-pip python3-venv build-essential -y
    ```
4.  **Install Audio Dependencies (for PyAudio/sounddevice - STT/TTS microphone input & audio output):
    ```bash
    sudo apt install portaudio19-dev libasound2-dev libportaudiocpp0 -y
    ```
    *   **Note:** You might also need `pavucontrol` for easier audio device management if using PulseAudio:
        ```bash
        sudo apt install pavucontrol -y
        ```
5.  **Install Dependencies for GUI (Tkinter is usually included with Python):
    *   If you plan to use Tkinter, it should be available. To be sure, you can install it explicitly:
        ```bash
        sudo apt install python3-tk -y
        ```
6.  **(Optional) Dependencies for Local STT/TTS (if you plan to use specific local engines early):
    *   **Vosk:** Check Vosk documentation for any specific system libraries.
    *   **Piper TTS:** Check Piper documentation. Often involves downloading pre-compiled binaries or specific build tools.
    *   **espeak-ng (basic local TTS):**
        ```bash
        sudo apt install espeak-ng -y
        ```

## 4. Audio Configuration (Microphone & Speakers)

1.  **Connect Microphone and Speakers:** Ensure your USB microphone and speakers (or HDMI audio output, or audio jack) are connected to the Raspberry Pi.
2.  **Identify Audio Devices:**
    *   List playback devices: `aplay -l`
    *   List recording devices: `arecord -l`
    *   Note the card and device numbers for your desired microphone and speakers.
3.  **Configure Default Audio Devices (ALSA - Advanced Linux Sound Architecture):
    *   Create or edit the ALSA configuration file: `sudo nano /etc/asound.conf` (or `~/.asoundrc` for user-specific settings).
    *   Set your default capture (input) and playback (output) devices. Example:
        ```
        pcm.!default {
          type asym
          capture.pcm "mic"
          playback.pcm "speaker"
        }

        pcm.mic {
          type plug
          slave {
            pcm "hw:X,Y"  # Replace X,Y with card,device from arecord -l
          }
        }

        pcm.speaker {
          type plug
          slave {
            pcm "hw:A,B"  # Replace A,B with card,device from aplay -l (e.g., HDMI or USB DAC)
          }
        }
        ```
    *   Save the file (Ctrl+X, then Y, then Enter in nano).
4.  **Test Audio:**
    *   Test recording: `arecord -d 5 test.wav` (records for 5 seconds)
    *   Test playback: `aplay test.wav`
    *   If using PulseAudio (common with desktop environments), `pavucontrol` can be used to select default devices and adjust volumes graphically.

## 5. Project Deployment & Setup

1.  **Clone the Yohan AI System Repository:**
    Navigate to where you want to store the project (e.g., `cd ~` or `cd /opt` for system-wide services).
    ```bash
    git clone <your_repository_url> yohan-ai-system
    cd yohan-ai-system
    ```
2.  **Create and Activate Python Virtual Environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
    *(To deactivate later, simply type `deactivate`)*
3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configuration Files:**
    *   Set up your API keys and other configurations as defined by the project (e.g., create a `config.yaml` or `.env` file from a template, ensuring it's in `.gitignore` if it contains secrets).

## 6. (Optional) Setting up Autostart

Once the application is ready and tested, you can configure it to start automatically on boot.

### Method 1: LXDE Autostart (if running a desktop environment)

1.  Create an autostart directory if it doesn't exist:
    ```bash
    mkdir -p ~/.config/autostart
    ```
2.  Create a `.desktop` file for your application (e.g., `~/.config/autostart/yohan.desktop`):
    ```bash
    nano ~/.config/autostart/yohan.desktop
    ```
3.  Add the following content, adjusting paths as necessary:
    ```ini
    [Desktop Entry]
    Type=Application
    Name=Yohan AI System
    Comment=Start Yohan AI Assistant
    Exec=/home/your_username/yohan-ai-system/.venv/bin/python /home/your_username/yohan-ai-system/main.py  # Adjust paths!
    StartupNotify=false
    Terminal=false # Set to true if you want to see terminal output for debugging
    ```
4.  Make the `.desktop` file executable (though usually not strictly necessary for autostart items):
    ```bash
    chmod +x ~/.config/autostart/yohan.desktop
    ```

### Method 2: systemd Service (more robust, good for headless operation)

1.  Create a service file (e.g., `/etc/systemd/system/yohan.service`):
    ```bash
    sudo nano /etc/systemd/system/yohan.service
    ```
2.  Add the following content, adjusting paths and user:
    ```ini
    [Unit]
    Description=Yohan AI System
    After=network.target sound.target # Ensure network and sound are ready

    [Service]
    User=your_username # The user the script should run as
    Group=your_username # The group the script should run as
    WorkingDirectory=/home/your_username/yohan-ai-system # Path to your project
    ExecStart=/home/your_username/yohan-ai-system/.venv/bin/python /home/your_username/yohan-ai-system/main.py # Adjust paths!
    Restart=on-failure # Or 'always'
    RestartSec=5
    StandardOutput=syslog # Or journal
    StandardError=syslog  # Or journal
    SyslogIdentifier=yohan-ai

    [Install]
    WantedBy=multi-user.target
    ```
3.  Reload systemd daemon, enable, and start the service:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable yohan.service
    sudo systemctl start yohan.service
    ```
4.  Check status:
    ```bash
    sudo systemctl status yohan.service
    journalctl -u yohan.service -f # To view logs
    ```

## 7. Final Checks

*   Ensure your Raspberry Pi 5 has an adequate power supply (the official 27W USB-C PSU is recommended).
*   Consider a case with good ventilation or a heatsink/fan, especially if the Pi will be under sustained load.

Your Raspberry Pi 5 should now be set up and ready for running the Yohan AI System. Remember to pull the latest changes from your Git repository and update dependencies as the project evolves.
