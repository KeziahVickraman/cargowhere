# Prompt History

This document collates all prompts submitted during the development of the **ParkSG Live** Singapore Carpark Lots Availability application.

---

## Prompt 1: Initial Frontend Application Build

**Date**: 2026-11-12  
**Context**: Initial project scaffolding and frontend interface development.

```text
build a singapore based carpark application that tracks real time carpark lots availability. build just the frontend for now, I will integrate the backend later.
```

**Delivered**:
- Comprehensive Singapore Carpark dataset (HDB, URA, Malls, CBD Towers) with coordinates, real HDB carpark numbers, height clearance, and EV charging stations.
- Real-time client-side synchronization with Singapore Open Data API (`data.gov.sg/v1/transport/carpark-availability`).
- Interactive Leaflet map with CartoDB Voyager tiles, custom status pins, and town quick-jump presets.
- Vehicle lot breakdown (Cars, Motorcycles, Heavy vehicles).
- Singapore Parking Rate Matrix & Fee Calculator (weekday daytime/night caps, weekend rates, and 10–15 min grace periods).
- Multi-criteria filtering, local storage bookmarking, and responsive desktop/mobile layouts.

---

## Prompt 2: GitHub Repository Push

**Date**: 2026-11-12  
**Context**: Initializing local Git repository and pushing project to remote GitHub repository.

```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/KeziahVickraman/cargowhere.git
```
*(Personal access token sanitized for security).*

**Delivered**:
- Configured Git workspace ownership and committed all files to the `main` branch.
- Successfully pushed to remote repository `https://github.com/KeziahVickraman/cargowhere.git`.

---

## Prompt 3: LTA DataMall Serverless API Integration

**Date**: 2026-11-12  
**Context**: Creating a backend serverless proxy connection to LTA DataMall.

```text
1. add a serverless connection that pulls live data from LTA's datamall using the following endpoint:

# Live carpark lots (HDB, LTA and URA):
https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>

2. store this in /api folder at project root level (not src file) 
3. include /health.ts and /carparkavailability.ts within the same sub folder
4. do not hardcode any key, I will input them later
```

**Delivered**:
- Created `/api/carparkavailability.ts` connecting to LTA DataMall with `AccountKey` header from environment variables, 500-record batch pagination (`?fetchAll=true`), agency/lotType filtering, and graceful fallback.
- Created `/api/health.ts` for service uptime and LTA key configuration status.
- Created `/server.ts` Express entry point mounted with Vite middleware in development.
- Added `LTA_ACCOUNT_KEY` entry in `.env.example`.
- Committed and pushed changes to GitHub.

---

## Prompt 4: Collate Prompts Documentation

**Date**: 2026-11-12  
**Context**: Storing all project prompts into a markdown reference file.

```text
collate all of the prompts and store them as a PROMPTS.md file
```

**Delivered**:
- Generated `/PROMPTS.md` documenting all project instructions and delivered solutions.
