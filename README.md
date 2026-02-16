# Real-Time Poll Rooms

This is a full-stack real-time poll application built as part of a technical hiring assessment. It lets anyone create polls, share them, and watch votes update instantly across all devices. Below you'll find a friendly overview of how it works, the fairness logic, edge cases, and a few known limitations.

---

## 🏗️ Architecture

- **Frontend:** React + TypeScript (Vite, deployed on Vercel)
- **Backend:** Node.js + Express + TypeScript (deployed on Render)
- **Database:** MongoDB Atlas (cloud-hosted)
- **Real-Time:** Socket.io for live updates

**How it works:**
- The frontend lets users create polls, vote, and see results live.
- The backend exposes REST APIs for poll creation, voting, and fetching poll data.
- Socket.io keeps all connected clients in sync, so everyone sees votes update instantly.
- MongoDB stores all polls and votes securely.

---

## ⚖️ Fairness Logic

To keep voting fair and prevent abuse, the backend enforces three mechanisms:

1. **IP-Based Duplicate Prevention:**
   - Each poll tracks votes by IP address. You can't vote twice from the same IP.

2. **Browser Fingerprint Token:**
   - Each browser gets a unique fingerprint token. Even if your IP changes, you can't vote again from the same browser.

3. **Vote Cooldown:**
   - There's a 30-second cooldown between votes from the same IP, so you can't spam polls.

All checks are enforced atomically in the backend, so even if you try to vote from multiple tabs/devices, only the first vote counts.

---

## 🛡️ Edge Cases Handled

- **Poll Not Found:**
  - If you visit a poll that doesn't exist, you'll see a friendly error message.

- **Empty Input:**
  - Polls require a question (min 5 chars) and at least 2 options (max 10, no duplicates).

- **Network Errors:**
  - If the backend is unreachable, you'll see a clear error and can retry.

- **Concurrent Vote Issues:**
  - All voting is wrapped in MongoDB transactions to prevent race conditions and double-counting.

- **Invalid Option:**
  - If you try to vote for an option that doesn't exist, you'll get an error.

- **Timeouts:**
  - If the backend takes too long to respond, you'll see a timeout error.

---

## 🚧 Known Limitations

- **No Poll Expiry:**
  - Polls never expire or auto-close. Anyone can vote at any time.

- **IP/Fingerprint Limitations:**
  - Users on shared networks (e.g., schools, offices) may be blocked from voting more than once.
  - Incognito mode or browser resets can bypass fingerprint checks.

- **No Authentication:**
  - Anyone can create polls and vote. There's no login or user accounts.

- **No Poll Deletion:**
  - Once created, polls can't be deleted from the UI.

- **Free Tier Hosting:**
  - Render and Vercel may sleep after inactivity, causing slow cold starts.

- **No Analytics:**
  - There's no admin dashboard or analytics for poll creators.

---

## 💡 How to Use

- Visit the frontend URL (Vercel) to create a poll.
- Share the link with friends or colleagues.
- Watch votes update live as people participate!

---

## 📌 Conclusion

This project was developed with a focus on correctness, real-time reliability, and fairness enforcement while keeping the architecture simple and maintainable. The implementation prioritizes clarity, scalability considerations, and practical trade-offs suitable for a production-like environment.
