export default async function handler(req, res) {
  try {
    // Vercel generally puts wildcard matches in req.query depending on exact config,
    // but we can parse it from req.url safely.
    // Example req.url: /api/preview?slug=cafe-esmeralda  or just /producto/cafe-esmeralda
    // Since vercel.json rewrites /producto/(.*) to /api/preview, req.url might be /producto/cafe-esmeralda
    const urlParts = req.url.split('?')[0].split('/');
    let slugOrId = urlParts.pop();
    if (!slugOrId || slugOrId === 'producto') {
         slugOrId = req.query.slug || '';
    }

    const projectId = "delva-cb9d5";
    let productData = null;

    if (slugOrId) {
        // 1. Try to fetch by ID directly
        const docRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${slugOrId}`);
        if (docRes.ok) {
            const doc = await docRes.json();
            productData = doc.fields;
        } else {
            // 2. Fallback: Query by slug
            const queryRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structuredQuery: {
                        from: [{ collectionId: 'products' }],
                        where: {
                            fieldFilter: {
                                field: { fieldPath: 'slug' },
                                op: 'EQUAL',
                                value: { stringValue: slugOrId }
                            }
                        },
                        limit: 1
                    }
                })
            });
            const queryData = await queryRes.json();
            if (queryData && queryData.length > 0 && queryData[0].document) {
                productData = queryData[0].document.fields;
            }
        }
    }

    // Default metadata
    let title = "DELVA | Marketplace de la Selva 🌿";
    let description = "La esencia de la selva en tu bolsillo. Moda, café premium y artesanías inspiradas en el Amazonas.";
    let image = "https://images.unsplash.com/photo-1518182170546-076616fdcbca?w=1200&q=80";

    // Extract product fields safely from Firestore REST structure
    if (productData) {
        if (productData.title && productData.title.stringValue) {
            title = productData.title.stringValue + " | DELVA";
        }
        if (productData.description && productData.description.stringValue) {
            description = productData.description.stringValue;
        }
        if (productData.image && productData.image.stringValue) {
            image = productData.image.stringValue;
        }
    }

    // 3. Fetch base index.html
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    
    // Fallback URL config for edge cases (local tests)
    const baseUrl = host ? `${protocol}://${host}` : 'https://delva.pe';
    
    const htmlRes = await fetch(`${baseUrl}/index.html`);
    let html = await htmlRes.text();

    // 4. Inject specific tags
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
    
    const ogTags = `
      <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
      <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
      <meta property="og:image" content="${image}" />
      <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
      <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
      <meta name="twitter:image" content="${image}" />
    `;

    // Strip generic OG tags to prevent duplicates
    html = html.replace(/<meta property="og:title".*?>/i, '');
    html = html.replace(/<meta property="og:description".*?>/i, '');
    html = html.replace(/<meta property="og:image".*?>/i, '');
    html = html.replace(/<meta name="twitter:card".*?>/i, '');
    
    html = html.replace('</head>', `${ogTags}\n<meta name="twitter:card" content="summary_large_image" />\n</head>`);

    // Cache header: Instruct CDN to cache this preview for 1 hour, allowing revalidation for a day
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);

  } catch (err) {
    console.error("Preview Generation Error:", err);
    // Generic fallback if everything fails
    res.status(500).send("Error interno generando la previsualización.");
  }
}
