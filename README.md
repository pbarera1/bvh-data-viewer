# BVH (Biovision Hierarchy) Data Viewer

- This React/Vite application let's you view select motion capture datasets from a basketball player. Visualization is in 3d using three.js

- Data curtosy of [mediafire](https://www.mediafire.com/?o6ncxuu1oq5r6z9)

- Live reference https://bvh-data-viewer.vercel.app/

## Requirement
Node >= v22.13.1

## Installation

```
npm i
```

## Usage

```
npm run dev
```

Go to http://localhost:5173 (or port listed in default is in use)

## Roadmap
- performance audit
- loading state before three.js scene renders
- UI error indication if bvh data fails to load (only in console currently)
