import http from 'http';
import app from '../server/index.js';

// Test runner for API and LaTeX compilation flow
async function runTests() {
  console.log('--- STARTING E2E INTEGRATION TESTS ---');

  const server = app.listen(3999, () => {
    console.log('Test server listening on port 3999');
  });

  const request = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
      const jsonBody = body ? JSON.stringify(body) : null;
      const headers = {};
      if (jsonBody) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(jsonBody);
      }

      const options = {
        hostname: 'localhost',
        port: 3999,
        path,
        method,
        headers
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    // 1. Test GET /api/tree
    console.log('1. Testing GET /api/tree...');
    const treeRes = await request('/api/tree');
    if (treeRes.status !== 200 || !treeRes.body.success) throw new Error('GET /api/tree failed');
    console.log(`   ✓ Found ${treeRes.body.allReferences.length} total CV references in hierarchy.`);

    // 2. Test GET /api/schema
    console.log('2. Testing GET /api/schema...');
    const schemaRes = await request('/api/schema');
    if (schemaRes.status !== 200 || !schemaRes.body.success) throw new Error('GET /api/schema failed');
    console.log(`   ✓ Loaded ${schemaRes.body.schema.length} master variable sections.`);

    // 3. Test GET /api/ref/data
    const sampleRef = treeRes.body.allReferences[0].relativePath;
    console.log(`3. Testing GET /api/ref/data for ${sampleRef}...`);
    const dataRes = await request(`/api/ref/data?path=${encodeURIComponent(sampleRef)}`);
    if (dataRes.status !== 200 || !dataRes.body.success) throw new Error('GET /api/ref/data failed');
    console.log(`   ✓ Loaded ${Object.keys(dataRes.body.variables).length} variables for ${sampleRef}`);

    // 4. Test POST /api/ref/save (Modifying variable & instant compile)
    console.log('4. Testing POST /api/ref/save with dynamic variable edit...');
    const modifiedVars = { ...dataRes.body.variables };
    modifiedVars.CVJobTitle = 'Expert Full-Stack & DevOps Architect \\\\[0.15em] Cloud Infrastructure';
    
    const saveRes = await request('/api/ref/save', 'POST', {
      relativePath: sampleRef,
      variables: modifiedVars,
      compile: true
    });
    if (saveRes.status !== 200 || !saveRes.body.success) throw new Error('POST /api/ref/save failed');
    console.log(`   ✓ Saved & Compiled in ${saveRes.body.compilation?.durationMs}ms with result: ${saveRes.body.compilation?.success}`);

    // 5. Test Cloning: POST /api/tree/reference
    console.log('5. Testing Reference Cloning (Create & Clone)...');
    const testCode = `R-TEST-${Date.now()}`;
    const cloneRes = await request('/api/tree/reference', 'POST', {
      targetDir: 'consulting/big4/Deloitte',
      refCode: testCode,
      sourceRef: sampleRef
    });
    if (cloneRes.status !== 200 || !cloneRes.body.success) throw new Error(`Cloning reference failed: ${cloneRes.body?.error}`);
    console.log(`   ✓ Created and compiled cloned reference: ${cloneRes.body.result.relativePath}`);

    // 6. Test YAML Export: GET /api/ref/yaml
    console.log('6. Testing YAML Export (GET /api/ref/yaml)...');
    const yamlRes = await request(`/api/ref/yaml?path=${encodeURIComponent(sampleRef)}`);
    if (yamlRes.status !== 200 || !yamlRes.body.success || !yamlRes.body.yaml) throw new Error('GET /api/ref/yaml failed');
    console.log(`   ✓ Exported YAML successfully (${yamlRes.body.yaml.length} bytes, file: ${yamlRes.body.filename})`);

    // 7. Test YAML Import: POST /api/ref/import-yaml
    console.log('7. Testing YAML Import (POST /api/ref/import-yaml)...');
    const importRes = await request('/api/ref/import-yaml', 'POST', {
      relativePath: cloneRes.body.result.relativePath,
      yamlString: yamlRes.body.yaml,
      compile: true
    });
    if (importRes.status !== 200 || !importRes.body.success) throw new Error('POST /api/ref/import-yaml failed');
    console.log(`   ✓ Applied YAML import & compiled in ${importRes.body.compilation?.durationMs}ms`);

    // 8. Test Delete of test reference
    console.log('8. Testing DELETE /api/tree/delete...');
    const delRes = await request('/api/tree/delete', 'DELETE', {
      relativePath: cloneRes.body.result.relativePath
    });
    if (delRes.status !== 200 || !delRes.body.success) throw new Error('DELETE reference failed');
    console.log(`   ✓ Successfully cleaned up test reference.`);

    console.log('--- ALL E2E INTEGRATION TESTS PASSED (100% SUCCESS) ---');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
