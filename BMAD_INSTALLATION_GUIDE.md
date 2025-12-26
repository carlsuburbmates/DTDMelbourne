# BMAD-METHOD Installation Guide for DTD Project

**Version:** 6.0.0-alpha.20  
**Project:** Dog Trainers Directory (DTD)  
**Date:** 2025-12-24

---

## Current Status

The BMAD-METHOD installer is currently running in your terminal and waiting for input. Please follow these steps to complete the installation.

---

## Installation Steps

### Step 1: Confirm Installation Directory

The installer is currently displaying:
```
? Installation directory: (/Users/carlg/Documents/PROJECTS/dogtrainersdirectory)
```

**Action:** Press `Enter` to accept the default directory.

---

### Step 2: Confirm Installation to Existing Directory

After pressing Enter, you will see:
```
Resolved installation path: /Users/carlg/Documents/PROJECTS/dogtrainersdirectory
Directory exists and contains 3 item(s)
? Install to this directory? (Y/n)
```

**Action:** Type `Y` and press `Enter` to confirm installation.

---

### Step 3: Configure Core Settings

You will be prompted with the following configuration questions. Use these responses:

#### 3.1 BMAD Root Folder
```
? What is the root folder for BMAD installation? (Recommended: .bmad)
```
**Response:** Press `Enter` to accept `.bmad`

#### 3.2 Agent Name
```
? What shall agents call you?
```
**Response:** Type `Carl` and press `Enter`

#### 3.3 Chat Language
```
? Preferred Chat Language/Style? (English, Mandarin, English Pirate, etc...)
```
**Response:** Press `Enter` to accept `English`

#### 3.4 Document Output Language
```
? Preferred Document Output Language?
```
**Response:** Press `Enter` to accept `English`

#### 3.5 Agent Sidecar Memory Folder
```
? Where should users' agent sidecar memory folders be stored?
```
**Response:** Press `Enter` to accept `.bmad-user-memory`

#### 3.6 AI Artifacts Output Folder
```
? Where should AI Generated Artifacts be saved across all modules?
```
**Response:** Type `_bmad-output` and press `Enter` (Note: Alpha.20 changed default from `docs` to `_bmad-output`)

#### 3.7 Install Documentation
```
? Install user documentation and optimized agent intelligence to each selected module's docs folder?
```
**Response:** Type `Y` and press `Enter`

---

### Step 4: Select Modules

You will see a module selection screen. Use the following selections:

```
? Select modules and custom content to install:
[── Official Content ──]
 ◉ BMB: BMAD Builder (Recommended for web app development)
 ◯ BMGD: BMAD Game Development
 ◉ BMM: Business Method & Management
 ◉ CIS: Creativity & Innovation Suite
```

**Actions:**
1. Use `Space` to select/deselect modules
2. Select: **BMB**, **BMM**, and **CIS**
3. Press `Enter` to continue

---

### Step 5: Custom Content

```
? Do you have custom content to install?
```
**Response:** Press `Enter` to select `No (skip custom content)`

---

## Expected Installation Output

After completing all prompts, you should see:

```
✓ BMAD-METHOD installed successfully
✓ Modules installed: BMB, BMM, CIS
✓ Kilocode modes generated
✓ Configuration complete

Next steps:
1. Open your project in VSCode
2. Select a BMAD mode from Kilocode
3. Start collaborating with BMAD agents
```

---

## Post-Installation Verification

Once installation completes, verify the following directories exist:

```bash
# Check BMAD installation directory
ls -la .bmad/

# Check agent sidecar memory
ls -la .bmad-user-memory/

# Check Kilocode modes
ls -la .kilocodemodes/

# Check AI artifacts output
ls -la _bmad-output/
```

---

## Next Steps After Installation

1. **Reload VSCode** - Press `Cmd+Shift+P` and type "Developer: Reload Window"

2. **Verify Kilocode Modes** - Click the Kilocode mode selector in the status bar (bottom right) and verify you see:
   - `bmad-bmb-bmad-builder`
   - `bmad-core-bmad-master`
   - `bmad-bmm-business-method-management`
   - `bmad-cis-creativity-innovation-suite`

3. **Test a BMAD Mode** - Select `bmad-bmb-bmad-builder` and try a simple interaction

---

## Troubleshooting

### If Installation Fails

1. **Clear NPX Cache:**
   ```bash
   npx --yes bmad-method@alpha install --clear-cache
   ```

2. **Check Node.js Version:**
   ```bash
   node --version  # Must be v20.x.x or higher
   ```

3. **Verify Network Connection** - Ensure you have internet access

### If Modes Don't Appear in VSCode

1. **Check .kilocodemodes Directory:**
   ```bash
   ls -la .kilocodemodes/
   ```

2. **Verify VSCode Settings:**
   - Open `.vscode/settings.json`
   - Ensure `"kilocode.modesPath": ".kilocodemodes"`
   - Ensure `"kilocode.autoLoadModes": true`

3. **Reload VSCode Window:**
   - Press `Cmd+Shift+P`
   - Type "Developer: Reload Window"

---

## Important Notes

- **Output Folder Change:** Alpha.20 changed the default output folder from `docs` to `_bmad-output`. The `docs` folder is now reserved for long-term artifacts.
- **BMM Module Changes:** If using BMM, planning artifacts go to `_bmad-output/planning-artifacts` and implementation artifacts go to `_bmad-output/implementation-artifacts`.
- **Git Ignore:** The `.bmad-user-memory/` folder should be added to `.gitignore` to prevent committing personal data.

---

## Configuration Summary

| Setting | Value |
|----------|--------|
| BMAD Root Folder | `.bmad` |
| Agent Name | `Carl` |
| Chat Language | `English` |
| Document Language | `English` |
| Sidecar Memory | `.bmad-user-memory` |
| AI Artifacts | `_bmad-output` |
| Modules | BMB, BMM, CIS |

---

**End of Installation Guide**
