# 🧠 CPU Scheduler Visualizer

An interactive web-based visualizer for various CPU scheduling algorithms. Built to help students and developers understand how CPU scheduling works in operating systems through step-by-step animations, detailed Gantt charts, and performance metrics.

[🔗 Live Demo](https://cpu-scheduler-visualizer-final.vercel.app/)

---

## ✨ Features

- 🚀 Supports multiple scheduling algorithms:
  - First-Come First-Serve (FCFS)
  - Shortest Job First (SJF)
  - Shortest Remaining Time First (SRTF)
  - Round Robin (RR)
  - Priority Scheduling (Preemptive & Non-Preemptive)

- 📊 Gantt chart generation for visual understanding
- 🧮 Displays average turnaround time, waiting time, and response time
- 📱 Responsive and intuitive UI
- 🔁 Dynamic input support for burst time, arrival time, priorities, and quantum

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Libraries:** Chart.js for Gantt chart rendering

---

## 📸 Screenshots

![App Screenshot](./screenshots/gantt-chart.png)
> Gantt chart with metrics after running SJF algorithm

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js >= 14.x
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/cpu-scheduler-visualizer.git
cd cpu-scheduler-visualizer
npm install
npm start
