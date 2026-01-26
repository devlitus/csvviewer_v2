# CSV Viewer & Visualizer

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/devlitus/csvviewer_v2?style=for-the-badge)](https://github.com/devlitus/csvviewer_v2/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/devlitus/csvviewer_v2?style=for-the-badge)](https://github.com/devlitus/csvviewer_v2/network/members)

![Project Preview](/public/images/preview.png)

A modern, responsive web application built with Astro and Tailwind CSS to upload, visualize, filter, and export CSV data.

## 🚀 Features

- **Drag & Drop Upload**: Easily upload CSV files to the system.
- **Data Visualization**: View your CSV data in a clean, paginated table.
- **Dynamic Filtering**: Select which columns to show or hide.
- **CSV/Excel Export**: Export filtered data back to CSV or Excel format.
- **Settings Management**: Highly customizable UI for project settings.
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State/Logic**: TypeScript
- **Parsing**: `csv-parse`, `xlsx`

## 📁 Project Structure

```text
/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components (Files, Visualizer, etc.)
│   ├── layouts/     # Page layouts
│   ├── pages/       # Application routes/pages
│   │   ├── api/     # API endpoints (Upload, Export)
│   │   ├── files.astro
│   │   ├── index.astro
│   │   ├── settings.astro
│   │   └── visualizer.astro
│   └── utils/       # Helper functions
├── files/           # Directory for uploaded CSV files
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
| :--- | :--- |
| `pnpm install` | Installs dependencies |
| `pnpm dev` | Starts local dev server at `localhost:4321` |
| `pnpm build` | Build your production site to `./dist/` |
| `pnpm preview` | Preview your build locally, before deploying |
| `pnpm astro ...` | Run CLI commands like `astro add`, `astro check` |

---

Developed with ❤️ by devlitus.
