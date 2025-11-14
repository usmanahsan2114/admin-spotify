// k6 Load Testing Script for Shopify Admin Dashboard
// Install k6: https://k6.io/docs/getting-started/installation/
// Run: k6 run load-test-k6.js

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const orderListLatency = new Trend('order_list_latency')
const productListLatency = new Trend('product_list_latency')
const dashboardLatency = new Trend('dashboard_latency')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users (load test)
    { duration: '1m', target: 200 },   // Ramp up to 200 users (stress test)
    { duration: '1m', target: 500 },   // Peak at 500 users (stress test)
    { duration: '2m', target: 100 },   // Ramp down to 100 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should be below 3s
    http_req_failed: ['rate<0.01'],     // Error rate should be less than 1%
    errors: ['rate<0.01'],              // Custom error rate < 1%
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:5000'

// Test users (should match seeded data)
const testUsers = [
  { email: 'admin@techhub.com', password: 'admin123' },
  { email: 'admin@fashionforward.com', password: 'admin123' },
  { email: 'staff1@techhub.com', password: 'staff123' },
]

// Helper function to login and get token
function login(email, password) {
  const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    email,
    password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
  
  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body)
    return body.token
  }
  return null
}

// Helper function to make authenticated request
function authenticatedRequest(method, url, token, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
  
  const params = { headers }
  
  if (body) {
    return http.request(method, url, JSON.stringify(body), params)
  }
  return http.request(method, url, null, params)
}

export default function () {
  // Select random test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)]
  
  // 1. Login
  const token = login(user.email, user.password)
  if (!token) {
    errorRate.add(1)
    return
  }
  
  sleep(1)
  
  // 2. Get dashboard metrics
  const dashboardRes = authenticatedRequest('GET', `${BASE_URL}/api/metrics/overview`, token)
  const dashboardCheck = check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  })
  if (dashboardCheck) {
    dashboardLatency.add(dashboardRes.timings.duration)
  } else {
    errorRate.add(1)
  }
  
  sleep(1)
  
  // 3. Get orders list
  const ordersRes = authenticatedRequest('GET', `${BASE_URL}/api/orders?limit=20`, token)
  const ordersCheck = check(ordersRes, {
    'orders status is 200': (r) => r.status === 200,
    'orders response time < 1s': (r) => r.timings.duration < 1000,
  })
  if (ordersCheck) {
    orderListLatency.add(ordersRes.timings.duration)
  } else {
    errorRate.add(1)
  }
  
  sleep(1)
  
  // 4. Get products list
  const productsRes = authenticatedRequest('GET', `${BASE_URL}/api/products?limit=20`, token)
  const productsCheck = check(productsRes, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 1s': (r) => r.timings.duration < 1000,
  })
  if (productsCheck) {
    productListLatency.add(productsRes.timings.duration)
  } else {
    errorRate.add(1)
  }
  
  sleep(1)
  
  // 5. Get customers list (if admin)
  if (user.email.includes('admin')) {
    const customersRes = authenticatedRequest('GET', `${BASE_URL}/api/customers`, token)
    check(customersRes, {
      'customers status is 200': (r) => r.status === 200,
    })
    sleep(1)
  }
  
  // 6. Health check (no auth required)
  const healthRes = http.get(`${BASE_URL}/api/health`)
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  })
  
  sleep(2)
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'load-test-results.json': JSON.stringify(data, null, 2),
  }
}

