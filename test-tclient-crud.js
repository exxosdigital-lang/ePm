(async () => {
  const base = "http://localhost:4000/api/tclient";
  try {
    const body = {
      Client_No: "C999",
      Client_Name: "Test Client",
      Product: "TestProd",
      PIC: "AI",
      Email: "test@example.com",
      Mobile: "0812999",
      Phone: "(021)000",
      Address: "Test Addr",
      Status: "Active",
    };
    let res = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let j = await res.json();
    console.log("POST ->", j);
    res = await fetch(base);
    j = await res.json();
    console.log("GET -> rows sample", j.rows && j.rows.slice(0, 5));
    const id =
      (j.rows && j.rows.find((r) => r.Client_No === "C999")?.id) || j.row?.id;
    console.log("Inserted id:", id);
    if (id) {
      res = await fetch(base + "/" + id, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Client_Name: "Test Client Edited" }),
      });
      console.log("PUT ->", await res.json());
      res = await fetch(base);
      j = await res.json();
      console.log(
        "GET after edit ->",
        j.rows.filter((r) => r.Client_No === "C999")
      );
      res = await fetch(base + "/" + id, { method: "DELETE" });
      console.log("DELETE ->", await res.json());
      res = await fetch(base);
      j = await res.json();
      console.log(
        "GET final ->",
        j.rows.filter((r) => r.Client_No === "C999")
      );
    }
  } catch (e) {
    console.error("error", e);
  }
})();
