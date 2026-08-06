const FIREBASE_PROJECT_ID = "project-2928494107224350968";

export default async function handler(req, res) {
  const { tagId, incrementPv } = req.query;

  if (!tagId) {
    return res.status(400).json({ error: 'tagId is required' });
  }

  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${tagId}`;

  if (req.method === 'GET') {
    try {
      const response = await fetch(firestoreUrl);
      if (!response.ok) {
        return res.status(200).json({ isReg: false });
      }

      const json = await response.json();
      const f = json.fields || {};
      
      let pv = f.pv && f.pv.integerValue ? parseInt(f.pv.integerValue, 10) : 0;
      if (incrementPv === 'true') {
        pv += 1;
      }

      const linkOrder = f.linkOrder && f.linkOrder.arrayValue && f.linkOrder.arrayValue.values
        ? f.linkOrder.arrayValue.values.map(v => v.stringValue)
        : ["ig", "tk", "bereal", "line"];

      const data = {
        isReg: f.isReg ? f.isReg.booleanValue : false,
        ig: f.ig ? f.ig.stringValue : "",
        tk: f.tk ? f.tk.stringValue : "",
        bereal: f.bereal ? f.bereal.stringValue : "",
        line: f.line ? f.line.stringValue : "",
        email: f.email ? f.email.stringValue : "",
        color: f.color ? f.color.stringValue : "#ff007f",
        pin: f.pin ? f.pin.stringValue : "",
        igShow: f.igShow ? f.igShow.booleanValue : true,
        tkShow: f.tkShow ? f.tkShow.booleanValue : true,
        berealShow: f.berealShow ? f.berealShow.booleanValue : true,
        lineShow: f.lineShow ? f.lineShow.booleanValue : true,
        image: f.image ? f.image.stringValue : "",
        linkOrder,
        pv
      };

      // PVカウントアップ時はFirestoreのデータも更新する
      if (incrementPv === 'true' && data.isReg) {
        await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              ...json.fields,
              pv: { integerValue: String(pv) }
            }
          })
        });
      }

      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const orderValues = (body.linkOrder || ["ig", "tk", "bereal", "line"]).map(k => ({ stringValue: k }));

      // 既存のPV数を取得して保持する
      let currentPv = "0";
      const oldRes = await fetch(firestoreUrl);
      if (oldRes.ok) {
        const oldJson = await oldRes.json();
        if (oldJson.fields && oldJson.fields.pv) {
          currentPv = oldJson.fields.pv.integerValue || "0";
        }
      }

      const payload = {
        fields: {
          ig: { stringValue: body.ig || "" },
          tk: { stringValue: body.tk || "" },
          bereal: { stringValue: body.bereal || "" },
          line: { stringValue: body.line || "" },
          email: { stringValue: body.email || "" },
          isReg: { booleanValue: true },
          color: { stringValue: body.color || "#ff007f" },
          pin: { stringValue: body.pin || "" },
          igShow: { booleanValue: Boolean(body.igShow) },
          tkShow: { booleanValue: Boolean(body.tkShow) },
          berealShow: { booleanValue: Boolean(body.berealShow) },
          lineShow: { booleanValue: Boolean(body.lineShow) },
          image: { stringValue: body.image || "" },
          linkOrder: { arrayValue: { values: orderValues } },
          pv: { integerValue: currentPv }
        }
      };

      await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
