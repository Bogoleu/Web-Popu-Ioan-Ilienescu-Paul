// check authentication and get user data
const user = JSON.parse(localStorage.getItem("loggedUser"));
if (!user) {
    window.location.href = "/login.html";
} else {
    document.getElementById("username").textContent = user.username;
    initializeDashboard();
}

function logout() {
    if (confirm("Esti sigur ca vrei sa te deconectezi?")) {
        // get token before clearing storage
        const token = localStorage.getItem("authToken");
        
        // clear all auth data
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedUser");
        
        // call logout endpoint to invalidate token on server
        if (token) {
            fetch("/auth/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }).catch(err => console.log("Logout request failed:", err));
        }
        
        // redirect to login page
        window.location.href = "../pages/login.html";
    }
}

// dashboard initialization
async function initializeDashboard() {
    try {
        showLoading();
        
        // set role-specific description
        setRoleDescription(user.role);
        
        // fetch dashboard analytics
        const analyticsData = await fetchDashboardAnalytics();
        
        // show appropriate role section
        showRoleSection(user.role);
        
        // populate dashboard based on user role
        switch(user.role) {
            case 'citizen':
                populateCitizenDashboard(analyticsData);
                break;
            case 'authorized_personnel':
                populatePersonnelDashboard(analyticsData);
                break;
            case 'decision_maker':
            case 'admin':
                populateDecisionMakerDashboard(analyticsData);
                break;
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        hideLoading();
        showError('Failed to load dashboard data');
    }
}

// utility functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('dashboard-content').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
}

function showError(message) {
    document.getElementById('loading').innerHTML = `<p style="color: red;">${message}</p>`;
}

function setRoleDescription(role) {
    const descriptions = {
        'citizen': 'Report waste issues and track your neighborhood status.',
        'authorized_personnel': 'Manage cleanup tasks and respond to citizen reports.',
        'decision_maker': 'Monitor city-wide waste management and make strategic decisions.',
        'admin': 'Full system administration and oversight capabilities.'
    };
    
    document.getElementById('role-description').textContent = descriptions[role] || descriptions['citizen'];
}

function showRoleSection(role) {
    // hide all sections first
    document.querySelectorAll('.role-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // show appropriate section
    const sectionMap = {
        'citizen': 'citizen-section',
        'authorized_personnel': 'personnel-section',
        'decision_maker': 'decision-section',
        'admin': 'decision-section'
    };
    
    const sectionId = sectionMap[role];
    if (sectionId) {
        document.getElementById(sectionId).style.display = 'grid';
    }
}

// api calls
async function fetchDashboardAnalytics() {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/dashboard/analytics', {
        headers: {
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard analytics');
    }
    
    const result = await response.json();
    return result.data;
}

async function fetchNeighborhoodComparison() {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/dashboard/comparison', {
        headers: {
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch neighborhood comparison');
    }
    
    const result = await response.json();
    return result.data;
}

// citizen dashboard functions
function populateCitizenDashboard(data) {
    // populate user report stats
    const userReports = data.recentReports || [];
    const pending = userReports.filter(r => r.status === 'pending').length;
    const resolved = userReports.filter(r => r.status === 'resolved').length;
    
    document.getElementById('user-pending').textContent = pending;
    document.getElementById('user-resolved').textContent = resolved;
    
    // populate recent reports
    populateRecentReports(userReports, 'citizen-reports');
    
    // draw neighborhood status chart
    drawNeighborhoodStatusChart(data.neighborhoodStats);
}

// personnel dashboard functions
function populatePersonnelDashboard(data) {
    // calculate task stats
    const allReports = data.recentReports || [];
    const pending = allReports.filter(r => r.status === 'pending').length;
    const inProgress = allReports.filter(r => r.status === 'in_progress').length;
    
    // completed today
    const today = new Date().toDateString();
    const completedToday = allReports.filter(r => 
        r.status === 'resolved' && 
        new Date(r.updatedAt).toDateString() === today
    ).length;
    
    document.getElementById('pending-tasks').textContent = pending;
    document.getElementById('progress-tasks').textContent = inProgress;
    document.getElementById('completed-tasks').textContent = completedToday;
    
    // populate priority tasks
    populatePriorityTasks(allReports, 'personnel-tasks');
    
    // draw weekly trend chart
    drawWeeklyTrendChart(data.weeklyTrend);
}

// decision maker dashboard functions
function populateDecisionMakerDashboard(data) {
    // populate overview stats
    const totalReports = data.neighborhoodStats.reduce((sum, n) => sum + n.totalReports, 0);
    const totalUsers = data.userStats.reduce((sum, u) => sum + u.count, 0);
    const totalResolved = data.neighborhoodStats.reduce((sum, n) => sum + n.resolved, 0);
    const efficiency = totalReports > 0 ? Math.round((totalResolved / totalReports) * 100) : 0;
    
    document.getElementById('total-reports').textContent = totalReports;
    document.getElementById('active-users').textContent = totalUsers;
    document.getElementById('efficiency-rate').textContent = `${efficiency}%`;
    
    // draw charts
    drawNeighborhoodRankingChart(data.neighborhoodStats);
    drawCategoryDistributionChart(data.categoryStats);
    
    // populate rankings
    populateRankings(data.neighborhoodStats);
    
    // setup comparison toggle
    setupComparisonToggle();
}

// chart drawing functions using vanilla canvas
function drawNeighborhoodStatusChart(neighborhoodStats) {
    const canvas = document.getElementById('citizen-chart');
    if (!canvas) return;
    
    // set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // account for padding
    const screenWidth = window.innerWidth;
    canvas.width = containerWidth;
    canvas.height = screenWidth >= 1600 ? 250 : 200;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!neighborhoodStats || neighborhoodStats.length === 0) {
        drawNoDataMessage(ctx, width, height);
        return;
    }
    
    // simple bar chart for top 5 neighborhoods
    const topNeighborhoods = neighborhoodStats.slice(0, 5);
    const barWidth = width / topNeighborhoods.length;
    const maxScore = Math.max(...topNeighborhoods.map(n => n.cleanlinessScore));
    
    topNeighborhoods.forEach((neighborhood, index) => {
        const barHeight = (neighborhood.cleanlinessScore / maxScore) * (height - 60);
        const x = index * barWidth + 10;
        const y = height - barHeight - 30;
        
        // draw bar
        ctx.fillStyle = getScoreColor(neighborhood.cleanlinessScore);
        ctx.fillRect(x, y, barWidth - 20, barHeight);
        
        // draw neighborhood name
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            neighborhood._id.length > 8 ? neighborhood._id.substring(0, 8) + '...' : neighborhood._id,
            x + (barWidth - 20) / 2,
            height - 10
        );
        
        // draw score
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(
            neighborhood.cleanlinessScore.toFixed(1),
            x + (barWidth - 20) / 2,
            y - 5
        );
    });
}

function drawWeeklyTrendChart(weeklyTrend) {
    const canvas = document.getElementById('personnel-trend-chart');
    if (!canvas) return;
    
    // set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // account for padding
    const screenWidth = window.innerWidth;
    canvas.width = containerWidth;
    canvas.height = screenWidth >= 1600 ? 300 : 250;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!weeklyTrend || weeklyTrend.length === 0) {
        drawNoDataMessage(ctx, width, height);
        return;
    }
    
    // line chart for weekly trend
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = new Array(7).fill(0);
    
    weeklyTrend.forEach(item => {
        data[item._id - 1] = item.count;
    });
    
    const maxValue = Math.max(...data, 1);
    const stepX = width / 7;
    const stepY = (height - 60) / maxValue;
    
    // draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
        ctx.beginPath();
        ctx.moveTo(i * stepX, 20);
        ctx.lineTo(i * stepX, height - 40);
        ctx.stroke();
    }
    
    // draw line
    ctx.strokeStyle = '#56ab2f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = index * stepX + stepX / 2;
        const y = height - 40 - (value * stepY);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // draw point
        ctx.fillStyle = '#56ab2f';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.stroke();
    
    // draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    days.forEach((day, index) => {
        const x = index * stepX + stepX / 2;
        ctx.fillText(day, x, height - 10);
    });
}

function drawNeighborhoodRankingChart(neighborhoodStats) {
    const canvas = document.getElementById('neighborhood-chart');
    if (!canvas) return;
    
    // set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // account for padding
    const screenWidth = window.innerWidth;
    canvas.width = containerWidth;
    canvas.height = screenWidth >= 1600 ? 400 : 300;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!neighborhoodStats || neighborhoodStats.length === 0) {
        drawNoDataMessage(ctx, width, height);
        return;
    }
    
    // horizontal bar chart
    const maxNeighborhoods = Math.min(neighborhoodStats.length, 8);
    const barHeight = (height - 40) / maxNeighborhoods;
    const maxScore = Math.max(...neighborhoodStats.map(n => n.cleanlinessScore));
    
    neighborhoodStats.slice(0, maxNeighborhoods).forEach((neighborhood, index) => {
        const barWidth = (neighborhood.cleanlinessScore / maxScore) * (width - 120);
        const x = 120;
        const y = index * barHeight + 10;
        
        // draw bar
        ctx.fillStyle = getScoreColor(neighborhood.cleanlinessScore);
        ctx.fillRect(x, y, barWidth, barHeight - 10);
        
        // draw neighborhood name
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            neighborhood._id.length > 12 ? neighborhood._id.substring(0, 12) + '...' : neighborhood._id,
            x - 10,
            y + barHeight / 2 + 4
        );
        
        // draw score
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(
            neighborhood.cleanlinessScore.toFixed(1),
            x + barWidth + 5,
            y + barHeight / 2 + 4
        );
    });
}

function drawCategoryDistributionChart(categoryStats) {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    
    // set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // account for padding
    const screenWidth = window.innerWidth;
    canvas.width = containerWidth;
    canvas.height = screenWidth >= 1600 ? 400 : 300;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!categoryStats || categoryStats.length === 0) {
        drawNoDataMessage(ctx, width, height);
        return;
    }
    
    // pie chart
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    const total = categoryStats.reduce((sum, cat) => sum + cat.count, 0);
    const colors = ['#56ab2f', '#3aafdb', '#e67e22', '#d35400', '#9b59b6', '#e74c3c', '#f39c12', '#27ae60', '#2980b9', '#8e44ad'];
    
    let currentAngle = 0;
    
    categoryStats.forEach((category, index) => {
        const sliceAngle = (category.count / total) * 2 * Math.PI;
        
        // draw slice
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // draw label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(category._id, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
}

// utility functions for charts
function getScoreColor(score) {
    if (score >= 80) return '#28a745'; // green
    if (score >= 60) return '#ffc107'; // yellow
    if (score >= 40) return '#fd7e14'; // orange
    return '#dc3545'; // red
}

function drawNoDataMessage(ctx, width, height) {
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', width / 2, height / 2);
}

// neighborhood status population for citizens
function populateNeighborhoodStatus(neighborhoodStats, userProfile) {
    // get user neighborhood from profile or recent reports
    const userNeighborhood = userProfile?.neighborhood || 'Unknown';
    const userNeighborhoodData = neighborhoodStats?.find(n => n._id === userNeighborhood) || neighborhoodStats?.[0];
    
    // update neighborhood name
    document.getElementById('user-neighborhood').textContent = userNeighborhood;
    
    if (!userNeighborhoodData) {
        document.getElementById('neighborhood-score').textContent = 'N/A';
        document.getElementById('neighborhood-total').textContent = '0';
        document.getElementById('neighborhood-pending').textContent = '0';
        document.getElementById('neighborhood-resolved').textContent = '0';
        document.getElementById('neighborhood-rank').textContent = '--';
        document.getElementById('total-neighborhoods').textContent = '--';
        return;
    }
    
    // update cleanliness score with appropriate styling
    const scoreElement = document.getElementById('neighborhood-score');
    const score = userNeighborhoodData.cleanlinessScore || 0;
    scoreElement.textContent = `${score.toFixed(1)}%`;
    
    // apply score styling
    scoreElement.className = 'cleanliness-badge';
    if (score >= 80) scoreElement.classList.add('high');
    else if (score >= 60) scoreElement.classList.add('medium');
    else scoreElement.classList.add('low');
    
    // update metrics with animation
    animateNumber('neighborhood-total', userNeighborhoodData.totalReports || 0);
    animateNumber('neighborhood-pending', userNeighborhoodData.pending || 0);
    animateNumber('neighborhood-resolved', userNeighborhoodData.resolved || 0);
    
    // calculate ranking
    const sortedNeighborhoods = [...neighborhoodStats].sort((a, b) => b.cleanlinessScore - a.cleanlinessScore);
    const userRank = sortedNeighborhoods.findIndex(n => n._id === userNeighborhood) + 1;
    
    document.getElementById('neighborhood-rank').textContent = userRank || '--';
    document.getElementById('total-neighborhoods').textContent = neighborhoodStats.length;
}

// list population functions
function populateRecentReports(reports, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No reports available</p><small>Create your first report to see it here</small></div>';
        return;
    }
    
    // limit to 5 most recent reports
    const recentReports = reports.slice(0, 5);
    
    container.innerHTML = recentReports.map(report => {
        const date = new Date(report.createdAt);
        const timeAgo = getTimeAgo(date);
        const issueType = report.issue || report.issueType || 'Unknown Issue';
        
        return `
            <div class="report-item">
                <div class="item-header">
                    <span class="item-title">${issueType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span class="item-status status-${report.status}">${report.status.replace(/_/g, ' ')}</span>
                </div>
                <div class="item-details">
                    <div class="location-info">
                        📍 ${report.dumpsterId ? `${report.dumpsterId.neighborhood}, ${report.dumpsterId.street}` : 'Location unavailable'}
                    </div>
                    <div class="time-info">
                        🕒 ${timeAgo}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function populatePriorityTasks(reports, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const priorityTasks = reports.filter(r => r.status === 'pending').slice(0, 10);
    
    if (priorityTasks.length === 0) {
        container.innerHTML = '<p>No pending tasks</p>';
        return;
    }
    
    container.innerHTML = priorityTasks.map(task => `
        <div class="task-item">
            <div class="item-header">
                <span class="item-title">${task.issue}</span>
                <span class="item-status status-${task.status}">${task.status}</span>
            </div>
            <div class="item-details">
                ${task.dumpsterId ? `${task.dumpsterId.neighborhood}, ${task.dumpsterId.street}` : 'Location unavailable'} - 
                Reported by: ${task.reporterId ? task.reporterId.username : 'Unknown'}
            </div>
        </div>
    `).join('');
}

function populateRankings(neighborhoodStats) {
    const container = document.getElementById('rankings-list');
    if (!container) return;
    
    if (!neighborhoodStats || neighborhoodStats.length === 0) {
        container.innerHTML = '<p>No ranking data available</p>';
        return;
    }
    
    container.innerHTML = neighborhoodStats.map((neighborhood, index) => {
        let className = '';
        let scoreClass = 'medium';
        
        if (index === 0) className = 'cleanest';
        if (index === neighborhoodStats.length - 1) className = 'dirtiest';
        
        if (neighborhood.cleanlinessScore >= 80) scoreClass = 'high';
        else if (neighborhood.cleanlinessScore < 40) scoreClass = 'low';
        
        return `
            <div class="ranking-item ${className}">
                <span class="ranking-name">${neighborhood._id}</span>
                <span class="ranking-score ${scoreClass}">${neighborhood.cleanlinessScore.toFixed(1)}</span>
            </div>
        `;
    }).join('');
}

// comparison functionality
function setupComparisonToggle() {
    const toggleBtn = document.getElementById('toggle-comparison');
    const comparisonContent = document.getElementById('comparison-content');
    
    if (!toggleBtn || !comparisonContent) return;
    
    toggleBtn.addEventListener('click', async () => {
        if (comparisonContent.style.display === 'none') {
            try {
                toggleBtn.textContent = 'Loading...';
                const comparisonData = await fetchNeighborhoodComparison();
                drawComparisonChart(comparisonData);
                comparisonContent.style.display = 'block';
                toggleBtn.textContent = 'Hide Detailed Comparison';
            } catch (error) {
                console.error('Error loading comparison data:', error);
                toggleBtn.textContent = 'Error Loading Data';
            }
        } else {
            comparisonContent.style.display = 'none';
            toggleBtn.textContent = 'Show Detailed Comparison';
        }
    });
}

function drawComparisonChart(comparisonData) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas || !comparisonData) return;
    
    // set canvas size based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 50; // account for padding
    const screenWidth = window.innerWidth;
    canvas.width = containerWidth;
    canvas.height = screenWidth >= 1600 ? 500 : 400;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (comparisonData.length === 0) {
        drawNoDataMessage(ctx, width, height);
        return;
    }
    
    // multi-line chart showing efficiency trends
    const neighborhoods = comparisonData.slice(0, 5); // limit to top 5
    const colors = ['#56ab2f', '#3aafdb', '#e67e22', '#d35400', '#9b59b6'];
    
    // find common months
    const allMonths = new Set();
    neighborhoods.forEach(n => {
        n.monthlyData.forEach(m => allMonths.add(`${m.year}-${m.month}`));
    });
    
    const sortedMonths = Array.from(allMonths).sort();
    const stepX = width / Math.max(sortedMonths.length - 1, 1);
    
    // draw each neighborhood line
    neighborhoods.forEach((neighborhood, index) => {
        ctx.strokeStyle = colors[index];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let isFirstPoint = true;
        sortedMonths.forEach((month, monthIndex) => {
            const monthData = neighborhood.monthlyData.find(m => `${m.year}-${m.month}` === month);
            if (monthData) {
                const x = monthIndex * stepX;
                const y = height - 60 - (monthData.efficiency * (height - 80) / 100);
                
                if (isFirstPoint) {
                    ctx.moveTo(x, y);
                    isFirstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        
        ctx.stroke();
        
        // draw legend
        const legendY = 20 + index * 20;
        ctx.fillStyle = colors[index];
        ctx.fillRect(width - 150, legendY, 15, 15);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(neighborhood._id, width - 130, legendY + 12);
    });
}
