requireAuth();

if (!isPremium()) {
    window.location.href = "premium-required.html";
} else {
    document.body.style.visibility = "visible";
    window.addEventListener("DOMContentLoaded", loadLeaderboard);
}


window.addEventListener("DOMContentLoaded", loadLeaderboard);

const LEADERBOARD_MEDALS = ["🥇", "🥈", "🥉"];

function getLeaderboardInitials(name) {

    return (name || "")
        .split(" ")
        .filter(Boolean)
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

}

async function loadLeaderboard() {

    try {

        const token = localStorage.getItem("token");

        const response = await axios.get(

            `${BASE_URL}/premium/leaderboard`,

            {

                headers: {

                    Authorization: token

                }

            }

        );

        const leaderboardData = response.data || [];

        const currentUser = getCurrentUser();
        const currentUserName = currentUser ? currentUser.name : null;

        renderLeaderboardPodium(leaderboardData, currentUserName);
        renderLeaderboardList(leaderboardData, currentUserName);

    }

    catch (err) {

        console.log(err);

    }

}

function renderLeaderboardPodium(data, currentUserName) {

    const podium = document.getElementById("leaderboardPodium");

    if (!podium) return;

    const topThree = data.slice(0, 3);

    podium.innerHTML = topThree.map((user, index) => {

        const isYou = !!currentUserName && user.name === currentUserName;

        return `
            <div class="podium-card podium-rank-${index + 1}${isYou ? " podium-you" : ""}">
                <div class="podium-medal">${LEADERBOARD_MEDALS[index]}</div>
                <div class="podium-avatar">${getLeaderboardInitials(user.name)}</div>
                <div class="podium-name">${user.name}${isYou ? " (You)" : ""}</div>
                <div class="podium-amount">₹${user.totalExpense}</div>
            </div>
        `;

    }).join("");

}

function renderLeaderboardList(data, currentUserName) {

    const leaderboard = document.getElementById("leaderboardList");

    leaderboard.innerHTML = "";

    data.forEach((user, index) => {

        const rank = index + 1;
        const medal = LEADERBOARD_MEDALS[index];
        const isYou = !!currentUserName && user.name === currentUserName;

        const li = document.createElement("li");

        li.className = "leaderboard-row" + (isYou ? " leaderboard-row-you" : "");

        li.innerHTML = `

            <span class="lb-rank">${medal ? medal : rank}</span>

            <span class="lb-user">
                <span class="lb-avatar">${getLeaderboardInitials(user.name)}</span>
                <span class="lb-name">${user.name}${isYou ? ' <span class="lb-you-badge">You</span>' : ""}</span>
            </span>

            <span class="lb-amount">₹${user.totalExpense}</span>

        `;

        leaderboard.appendChild(li);

    });

}