export async function saveGeometry(geometry) {
   const response = await fetch("http://localhost:3000/geometry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geometry),
   });
   return await response.json();
}

export async function loadGeometry() {
   const response = await fetch("http://localhost:3000/geometry");

   return await response.json();
}

export async function deleteGeometry(id) {
   const response = await fetch(`http://localhost:3000/geometry/${id}`, {
      method: "DELETE",
   });
   return await response.json();
}

export async function updateGeometry(id, geometry) {
   const response = await fetch(`http://localhost:3000/geometry/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geometry),
   });

   return await response.json();
}
