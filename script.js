/*
 * ISSATSo Board - Partie JavaScript (Sujet 3 : Dashboard)
 * Fonctionnalités :
 *   1. Tri, filtrage et mise à jour dynamique du tableau des paiements
 *   2. Graphiques interactifs avec Chart.js (histogramme + anneau)
 *   3. Actualisation automatique des données (simulée avec setInterval)
 *   Bonus suggérés : plusieurs types de graphiques, export CSV du tableau
 * Bibliothèque externe : Chart.js 4.4.1 (chargée dans index.html)
 */
(() => {
    "use strict";

    /* ---------- Constantes et données fictives ---------- */

    const REFRESH_MS = 5000;   // intervalle d'actualisation simulée
    const MAX_ROWS = 30;       // nombre maximal de paiements conservés

    const STATUS_LABELS = { paid: "Payé", pending: "En attente", cancelled: "Annulé" };

    // Les paiements : le tableau HTML est généré à partir de ces données
    const d = (jour) => new Date(`2026-10-${jour}T12:00:00`).getTime();
    let transactions = [
        { id: 7881, name: "Salma Jebali",    date: d("10"), amount: 600,    status: "paid" },
        { id: 7882, name: "Hatem Bouzid",    date: d("11"), amount: 210,    status: "pending" },
        { id: 7883, name: "Ines Chaabane",   date: d("12"), amount: 1250,   status: "paid" },
        { id: 7884, name: "Walid Mansouri",  date: d("12"), amount: 95.5,   status: "cancelled" },
        { id: 7885, name: "Sarra Hamdi",     date: d("13"), amount: 480,    status: "paid" },
        { id: 7886, name: "Omar Zouari",     date: d("13"), amount: 730,    status: "pending" },
        { id: 7887, name: "Nour Ben Salah",  date: d("14"), amount: 350,    status: "paid" },
        { id: 7888, name: "Anis Miled",      date: d("14"), amount: 175,    status: "cancelled" },
        { id: 7889, name: "Rania Gharbi",    date: d("15"), amount: 890,    status: "paid" },
        { id: 7890, name: "Bilel Ben Ammar", date: d("16"), amount: 320.5,  status: "pending" },
        { id: 7891, name: "Mehdi Trabelsi",  date: d("16"), amount: 1250,   status: "paid" },
        { id: 7892, name: "Yasmine Karray",  date: d("17"), amount: 450,    status: "paid" }
    ];

    // Données utilisées pour simuler l'arrivée de nouveaux paiements
    const NAMES = ["Khaled Riahi", "Amal Ferchichi", "Slim Dridi", "Mariem Ayari",
                   "Youssef Najjar", "Emna Louati", "Karim Selmi", "Lina Gharsallah"];
    const AMOUNTS = [120, 175, 250, 320, 450, 600, 890, 1250];
    const STATUSES = ["paid", "paid", "paid", "pending", "cancelled"]; // « paid » plus fréquent

    // Recettes mensuelles (kDT) : le dernier mois suit le revenu total en direct
    let revenue = 48580;                                   // en DT
    const monthLabels = ["Mai", "Juin", "Juil.", "Août", "Sept.", "Oct."];
    const monthlyRevenue = [28, 35, 31, 42, 38];           // mois précédents
    const currentMonthValue = () => Number((revenue / 1000).toFixed(2));

    // État du tableau (tri + filtres)
    const state = { sortKey: "date", sortDir: "desc", search: "", status: "all" };

    /* ---------- Outils ---------- */

    const $ = (id) => document.getElementById(id);
    const cssVar = (nom) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const formatAmount = (n) =>
        n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DT";
    const formatDate = (ts) =>
        new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    const receiptId = (id) => "#REC-" + id;
    const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

    /* ---------- 1. Tableau : filtrage, tri, affichage ---------- */

    const tbody = $("payments-body");

    // Retourne les paiements filtrés puis triés selon l'état courant
    function getVisibleRows() {
        const recherche = state.search.trim().toLowerCase();

        const rows = transactions.filter((t) => {
            const okStatus = state.status === "all" || t.status === state.status;
            const okSearch = !recherche ||
                t.name.toLowerCase().includes(recherche) ||
                receiptId(t.id).toLowerCase().includes(recherche);
            return okStatus && okSearch;
        });

        const sens = state.sortDir === "asc" ? 1 : -1;
        rows.sort((a, b) => {
            let r;
            if (state.sortKey === "name") r = a.name.localeCompare(b.name, "fr");
            else if (state.sortKey === "status") r = STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], "fr");
            else r = a[state.sortKey] - b[state.sortKey];   // id, date, amount : numériques
            return (r || a.id - b.id) * sens;
        });
        return rows;
    }

    // Construit une ligne <tr> (textContent : pas d'injection de HTML)
    function buildRow(t) {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        const strongId = document.createElement("strong");
        strongId.textContent = receiptId(t.id);
        tdId.appendChild(strongId);

        const tdName = document.createElement("td");
        const user = document.createElement("div");
        user.className = "table-user";
        const avatar = document.createElement("div");
        avatar.className = "user-avatar xs";
        avatar.textContent = initials(t.name);
        const nom = document.createElement("span");
        nom.textContent = t.name;
        user.append(avatar, nom);
        tdName.appendChild(user);

        const tdDate = document.createElement("td");
        tdDate.textContent = formatDate(t.date);

        const tdAmount = document.createElement("td");
        const strongAmount = document.createElement("strong");
        strongAmount.textContent = formatAmount(t.amount);
        tdAmount.appendChild(strongAmount);

        const tdStatus = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "status-badge " + t.status;
        badge.textContent = STATUS_LABELS[t.status];
        tdStatus.appendChild(badge);

        tr.append(tdId, tdName, tdDate, tdAmount, tdStatus);
        return tr;
    }

    // Réaffiche tout le tableau (appelé après chaque tri, filtre ou actualisation)
    function renderTable() {
        const rows = getVisibleRows();
        tbody.replaceChildren();

        if (rows.length === 0) {
            const tr = document.createElement("tr");
            tr.className = "empty-row";
            const td = document.createElement("td");
            td.colSpan = 5;
            td.textContent = "Aucun paiement ne correspond à votre recherche.";
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            rows.forEach((t) => tbody.appendChild(buildRow(t)));
        }

        $("result-count").textContent = `${rows.length} paiement(s) affiché(s) sur ${transactions.length}`;

        // Indicateur de tri (attribut aria-sort, stylé en CSS)
        document.querySelectorAll("#payments-table th").forEach((th) => {
            const key = th.querySelector(".sort-btn").dataset.key;
            th.setAttribute("aria-sort",
                key === state.sortKey ? (state.sortDir === "asc" ? "ascending" : "descending") : "none");
        });
    }

    // Clic sur un en-tête : trie par cette colonne (un 2e clic inverse l'ordre)
    document.querySelectorAll(".sort-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            if (state.sortKey === key) {
                state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
            } else {
                state.sortKey = key;
                state.sortDir = "asc";
            }
            renderTable();
        });
    });

    $("table-search").addEventListener("input", (e) => { state.search = e.target.value; renderTable(); });
    $("status-filter").addEventListener("change", (e) => { state.status = e.target.value; renderTable(); });

    /* ---------- Export CSV (bonus) : exporte les lignes actuellement affichées ---------- */

    function exportCsv() {
        const rows = getVisibleRows();
        const entetes = ["ID Reçu", "Nom", "Date", "Montant (DT)", "Statut"];
        const lignes = rows.map((t) => [
            receiptId(t.id),
            t.name,
            new Date(t.date).toISOString().slice(0, 10),
            t.amount.toFixed(2).replace(".", ","),   // virgule décimale (Excel FR)
            STATUS_LABELS[t.status]
        ]);
        const echapper = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = [entetes, ...lignes].map((l) => l.map(echapper).join(";")).join("\r\n");

        // \uFEFF : BOM pour que Excel lise correctement les accents
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = "paiements.csv";
        document.body.appendChild(lien);
        lien.click();
        lien.remove();
        URL.revokeObjectURL(url);
    }
    $("export-csv").addEventListener("click", exportCsv);

    /* ---------- 2. Graphiques Chart.js ---------- */

    let revenueChart = null;

    function initCharts() {
        // Si Chart.js n'a pas pu être chargé (hors ligne par exemple) : message à la place des graphiques
        if (typeof Chart === "undefined") {
            ["revenue-chart", "dept-chart"].forEach((id) => {
                const msg = document.createElement("p");
                msg.className = "chart-fallback";
                msg.textContent = "Graphique indisponible : la bibliothèque Chart.js n'a pas pu être chargée.";
                $(id).replaceWith(msg);
            });
            return;
        }

        Chart.defaults.font.family = "Inter, sans-serif";
        Chart.defaults.color = cssVar("--text-muted");
        if (reduceMotion) Chart.defaults.animation = false;   // respect de prefers-reduced-motion

        // Histogramme des recettes : le dernier mois est mis en évidence
        const couleurs = monthLabels.map((_, i) =>
            i === monthLabels.length - 1 ? cssVar("--primary") : "#cbd5e1");
        revenueChart = new Chart($("revenue-chart"), {
            type: "bar",
            data: {
                labels: monthLabels,
                datasets: [{
                    label: "Recettes (kDT)",
                    data: [...monthlyRevenue, currentMonthValue()],
                    backgroundColor: couleurs,
                    hoverBackgroundColor: cssVar("--primary-hover"),
                    borderRadius: 6,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y.toLocaleString("fr-FR")} kDT` } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: (v) => v + "k" } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Anneau : répartition des inscriptions par département
        new Chart($("dept-chart"), {
            type: "doughnut",
            data: {
                labels: ["Génie Informatique", "Génie Électromécanique", "Génie Civil", "Licences Appliquées"],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [cssVar("--primary"), cssVar("--secondary"), cssVar("--success"), cssVar("--warning")],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                    legend: { position: "bottom", labels: { boxWidth: 12 } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label} : ${ctx.parsed} %` } }
                }
            }
        });
    }

    /* ---------- 3. Actualisation automatique (simulée) ---------- */

    const pick = (liste) => liste[Math.floor(Math.random() * liste.length)];

    // Simule l'arrivée d'un nouveau paiement
    function simulateNewPayment() {
        const dernierId = Math.max(...transactions.map((t) => t.id));
        const nouveau = {
            id: dernierId + 1,
            name: pick(NAMES),
            date: Date.now(),
            amount: pick(AMOUNTS),
            status: pick(STATUSES)
        };
        transactions.push(nouveau);
        if (transactions.length > MAX_ROWS) {
            transactions.sort((a, b) => a.id - b.id);
            transactions = transactions.slice(-MAX_ROWS);   // on garde les plus récents
        }
        if (nouveau.status === "paid") revenue += nouveau.amount;
    }

    function refreshData() {
        simulateNewPayment();

        // KPI « Revenu total »
        $("kpi-revenue").textContent = Math.round(revenue).toLocaleString("fr-FR") + " DT";

        // Histogramme : mise à jour du dernier mois
        if (revenueChart) {
            revenueChart.data.datasets[0].data[monthLabels.length - 1] = currentMonthValue();
            revenueChart.update();
        }

        // Tableau (en conservant le tri et les filtres actifs)
        renderTable();
        $("last-update").textContent = "Dernière mise à jour : " + new Date().toLocaleTimeString("fr-FR");
    }

    /* ---------- Démarrage ---------- */

    // Les graphiques sont créés après le chargement de la police Inter : Chart.js mesure
    // le texte au moment de la création, sinon la légende serait mal positionnée.
    const policePrete = document.fonts ? document.fonts.load("400 12px Inter") : Promise.resolve();
    policePrete.catch(() => {}).then(initCharts);
    renderTable();
    $("last-update").textContent = "Actualisation automatique toutes les " + REFRESH_MS / 1000 + " s";
    setInterval(refreshData, REFRESH_MS);
})();
