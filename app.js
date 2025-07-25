// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
console.log("FS initialized!");
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";  

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadGroupedOrders() {
  
  const q = query(collection(db, "orders"), orderBy("orderTimeStamp", "desc"), limit(5));
  const ordersSnap = await getDocs(q);
  const orders = ordersSnap.docs.map(doc => doc.data());

  const table = document.getElementById("orders-table");
  const grouped = {};
  
  renderTopSalesChart(orders);

  updatePendingOrdersCount(orders);
  updateTotalOrdersCount(orders);
  updateRevenue(orders);
  updateCompletedOrdersCount(orders);
  
  
  orders.forEach((order) => {
    const orderId = order.orderId || doc.id;

    if (!grouped[orderId]) {
      grouped[orderId] = {
        date: order.orderTimeStamp?.toDate?.() || new Date(),
        status: order.status || "Pending",
        items: []
      };
    }

    order.items?.forEach((item) => {
      grouped[orderId].items.push(item);
    });
  });

  // Render
  Object.entries(grouped).forEach(([orderId, order]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6">
        <strong>${orderId}</strong> - ${order.date.toLocaleString()} - 
        <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
      </td>
    `;
    row.style.background = "#f0f0f0";
    table.appendChild(row);

    order.items.forEach((item) => {
      const itemRow = document.createElement("tr");
      itemRow.innerHTML = `
        <td></td>
        <td>${item.pizzaName} - ${item.size}</td>
        <td>${item.quantity}</td>
        <td>${(item.toppings || []).join(", ")}</td>
        <td>₹${item.totalPrice}</td>
      `;
      table.appendChild(itemRow);
    });
  });
}

async function renderTopSalesChart(orders) {

  const salesMap = {}; // { "Margherita Pizza": { quantity: 3, revenue: 500 } }

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      const key = item.pizzaName;

      if (!salesMap[key]) {
        salesMap[key] = { quantity: 0, revenue: 0 };
      }

      salesMap[key].quantity += item.quantity;
      salesMap[key].revenue += item.totalPrice;
    });
  });

  // Convert to arrays for Chart.js
  const labels = Object.keys(salesMap);
  const data = labels.map(name => salesMap[name].quantity); // or .revenue

  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Top Selling Pizzas',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantity Sold' }
        }
      }
    }
  });

  const ctx2 = document.getElementById('topPizzaChart').getContext('2d');
  const sorted = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const top3labels = sorted.map(([name]) => name);
  const dataValues = sorted.map(([_, qty]) => qty.quantity); 

  const data2 = {
    labels: top3labels,
    datasets: [{
      label: 'Top 3 Sales',
      data: dataValues, 
      backgroundColor: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(173, 255, 47, 0.7)',
        'rgba(75, 192, 192, 0.7)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(173, 255, 47, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };

  new Chart(ctx2, {
    type: 'pie',
    data: data2,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updatePendingOrdersCount(orders){
    const pendingCount = orders.filter(order => order.status === 'Pending').length;
    document.getElementById('pendingOrders').textContent = pendingCount;
}

function updateTotalOrdersCount(orders){
    const totalCount = orders.length;
    document.getElementById('totalOrders').textContent = totalCount;
}

function updateRevenue(orders){
    const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.items?.reduce((itemSum, item) => itemSum + item.totalPrice, 0) || 0);
    }, 0);
    document.getElementById('revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
}

function updateCompletedOrdersCount(orders){
    const completedCount = orders.filter(order => order.status === 'Completed').length;
    document.getElementById('completedOrders').textContent = completedCount;
} 

loadGroupedOrders();