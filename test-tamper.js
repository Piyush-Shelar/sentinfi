

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sentinfi.com', password: 'AdminPassword123!' })
  });
  const loginData = await loginRes.json();
  
  if (!loginData.accessToken) {
    console.log("Login failed:", loginData);
    return;
  }
  
  const docsRes = await fetch('http://localhost:5000/api/admin/all-documents', {
    headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
  });
  const docs = await docsRes.json();
  console.log("Documents found:", docs.length);
  
  const unauthorizedDoc = docs.find(d => !d.isAuthorized);
  if (!unauthorizedDoc) {
    console.log("No unauthorized docs found");
    return;
  }
  
  console.log("Testing verify on doc:", unauthorizedDoc._id);
  const verifyRes = await fetch(`http://localhost:5000/api/documents/${unauthorizedDoc._id}/verify-and-view`, {
    headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
  });
  const verifyData = await verifyRes.json();
  console.log("Status:", verifyRes.status);
  console.log("Response:", verifyData);
}
test();
