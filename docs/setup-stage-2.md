# Stage 2 — Setup Session

Complete these steps during the setup session with your instructor. You will need your IBM i credentials (provided by your instructor) and your laptop with Bob installed.

---

## 0.3 — Find Your Assigned Library Number

Your instructor will assign you a library number. Each participant has their own copy of the FLIGHT400 application in a library named **FLGHT4nn** (e.g. FLGHT401, FLGHT402). Use only your assigned number throughout all exercises so everyone can work independently.

> ⚠️ The library name is `FLGHT4nn` — note there is **no "I"** in FLGHT. Always type `FLGHT4nn` (F‑L‑G‑H‑T), not FLIGHT4nn.

| Student # | Library | Dev Port | React App URL |
|:---------:|---------|:--------:|---------------|
| 1  | `FLGHT401` | 3001 | `http://localhost:3001` |
| 2  | `FLGHT402` | 3002 | `http://localhost:3002` |
| 3  | `FLGHT403` | 3003 | `http://localhost:3003` |
| 4  | `FLGHT404` | 3004 | `http://localhost:3004` |
| 5  | `FLGHT405` | 3005 | `http://localhost:3005` |
| 6  | `FLGHT406` | 3006 | `http://localhost:3006` |
| 7  | `FLGHT407` | 3007 | `http://localhost:3007` |
| 8  | `FLGHT408` | 3008 | `http://localhost:3008` |
| 9  | `FLGHT409` | 3009 | `http://localhost:3009` |
| 10 | `FLGHT410` | 3010 | `http://localhost:3010` |
| 11 | `FLGHT411` | 3011 | `http://localhost:3011` |
| 12 | `FLGHT412` | 3012 | `http://localhost:3012` |
| 13 | `FLGHT413` | 3013 | `http://localhost:3013` |
| 14 | `FLGHT414` | 3014 | `http://localhost:3014` |
| 15 | `FLGHT415` | 3015 | `http://localhost:3015` |
| 16 | `FLGHT416` | 3016 | `http://localhost:3016` |
| 17 | `FLGHT417` | 3017 | `http://localhost:3017` |
| 18 | `FLGHT418` | 3018 | `http://localhost:3018` |
| 19 | `FLGHT419` | 3019 | `http://localhost:3019` |
| 20 | `FLGHT420` | 3020 | `http://localhost:3020` |

> 💡 The **Dev Port** is only needed for Exercise 4.

---

## 0.4 — Connect Bob IDE to IBM i

**Step 1 — Add a new connection**
Click the IBM i icon in the Activity Bar, then click **New Connection**. Enter the host IP, user profile, and `ssh_private_key` provided by your instructor. When prompted for the private key, browse to the downloaded `ssh_private_key.pem` file. **Do not use the password here — use only the private key file.**

![IBM i icon in the Bob Activity Bar](img/ibmi_icon.png)

![IBM i connection dialog in Bob IDE](img/i-connection.png)

**Step 2 — Add your assigned library to the User Library List**
In the Code for IBM i extension, navigate to **User Library List** and click the **+** icon. Type `FLGHT4nn` (replace `nn` with your assigned number) and press **Enter**.

![User Library List section in the Code for IBM i extension](img/add-library.png)

![Input field prompting for library name](img/add-library-name.png)

**Step 3 — Add your assigned library to the Object Browser**
Go to the **Object Browser** section and click the funnel icon or **Create new filter**. Set **Libraries** to `FLGHT4nn` and **Object types** to `*ALL`. Click **Save Settings**.

> ⚠️ Use `*ALL`, not `*` — the wildcard `*` does not work for filtering object types.

![Object Browser section showing the funnel/Create new filter button](img/add-object-filter.png)

![Object Browser filter fields with Object types set to *ALL](img/objectfilter.jpeg)

**Step 4 — Set the workspace to Library List**
Click the **+** icon above the Bob chat window. Select **New Task in Library List** and confirm your `FLGHT4nn` library is listed.

![Bob scope picker showing New Task in Library List option](img/set-workspace.png)

![Library List scope selected in the Bob chat](img/librarylist.png)

---

## 0.5 — (Optional) SSH Tunnel

Only needed for green-screen access and Exercise 4.

**Step 1 — Set key file permissions**

macOS / Linux:
```bash
chmod 600 ssh_private_key.pem
```

Windows (PowerShell, run as Administrator):
```powershell
icacls ssh_private_key.pem /inheritance:r /grant:r "$($env:USERNAME):R"
```

**Step 2 — Open the SSH tunnel**

Replace `<myuser>@<myIPaddress>` with the values from your instructor:

![Lab network diagram — Bob IDE and ACS connecting via SSH tunnel to IBM i on TechZone](img/bob-lab-network.png)

```bash
ssh -L 50000:localhost:23 -L 2001:localhost:2001 -L 449:localhost:449 -L 8470:localhost:8470 -L 8471:localhost:8471 -L 8472:localhost:8472 -L 2007:localhost:2007 -L 8473:localhost:8473 -L 8474:localhost:8474 -L 8475:localhost:8475 -L 8476:localhost:8476 -L 2003:localhost:2003 -L 2002:localhost:2002 -L 2006:localhost:2006 -L 2300:localhost:2300 -L 2323:localhost:2323 -L 2005:localhost:2005 -L 8076:localhost:8076 -L 3001:localhost:3001 -L 3002:localhost:3002 -L 3003:localhost:3003 -L 3004:localhost:3004 -L 3005:localhost:3005 -L 3006:localhost:3006 -L 3007:localhost:3007 -L 3008:localhost:3008 -L 3009:localhost:3009 -L 3010:localhost:3010 -L 3011:localhost:3011 -L 3012:localhost:3012 -L 3013:localhost:3013 -L 3014:localhost:3014 -L 3015:localhost:3015 -L 3016:localhost:3016 -L 3017:localhost:3017 -L 3018:localhost:3018 -L 3019:localhost:3019 -L 3020:localhost:3020 -o ExitOnForwardFailure=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 <myuser>@<myIPaddress> -i ssh_private_key.pem
```

**Step 3 — (Optional) Connect IBM i Access Client Solutions for 5250**
Install [IBM i Access Client Solutions](https://www.ibm.com/support/pages/ibm-i-access-client-solutions), open the 5250 Emulator, set IP Address to `127.0.0.1` and port to `50000`. Log in with your username and password, then:

```bash
ADDLIBLE FLGHT4nn
CALL FLGHT4nn/FRS021
```

![Flight Maintenance screen in 5250 emulator](img/ACS-green-screen.png)

> ⚠️ When finished, exit the 5250 screen by pressing **F3**.
