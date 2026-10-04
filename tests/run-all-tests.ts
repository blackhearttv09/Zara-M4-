/**
 * M4 Five OS — Comprehensive Automated Test Suite (STEP 24)
 */

import { m4Core } from '../server/m4-core.ts';
import { ipcBus } from '../server/m4-ipc.ts';
import { securityManager } from '../server/m4-security.ts';
import { memorySubsystem } from '../server/m4-memory.ts';
import { skillsSubsystem } from '../server/m4-skills.ts';
import { toolSubsystem } from '../server/m4-tools.ts';
import { agentSubsystem } from '../server/m4-agents.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   M4 FIVE OS — AUTOMATED TEST SUITE RUNNER         ');
  console.log('====================================================\n');

  // Test 1: M4 Core
  console.log('[TEST GROUP 1] M4 Core Supervisor:');
  const telemetry = m4Core.getTelemetry();
  assert(telemetry.osName === 'M4 Five OS', 'Telemetry returns correct OS name');
  assert(telemetry.version === '5.0.0-release', 'Telemetry version matches 5.0.0-release');
  assert(telemetry.cpuUsagePercent >= 0, 'CPU usage is a valid percentage');

  // Test 2: IPC Bus
  console.log('\n[TEST GROUP 2] IPC Service Communication:');
  let receivedFrame = false;
  const unsub = ipcBus.subscribe('test.channel', (frame) => {
    if (frame.sender === 'test-runner') receivedFrame = true;
  });
  ipcBus.publish('test.channel', 'test-runner', { status: 'OK' });
  assert(receivedFrame, 'IPC pub/sub delivers event synchronously');
  unsub();

  // Test 3: Security & Zero-Trust
  console.log('\n[TEST GROUP 3] Security & Zero-Trust Sandbox:');
  const safeEval = await securityManager.evaluateRequest('test-agent', 'system.info', {});
  assert(safeEval.allowed, 'Low-risk tool system.info auto-approved within policy');

  const blockedExploit = await securityManager.evaluateRequest('test-agent', 'terminal.execute', {
    command: 'rm -rf /',
  });
  assert(!blockedExploit.allowed, 'Malicious rm -rf / blocked by strict anti-destruction filter');

  const highRiskEval = await securityManager.evaluateRequest('test-agent', 'files.write', {
    path: '/tmp/test.txt',
    content: 'hello',
  });
  assert(!highRiskEval.allowed && !!highRiskEval.pendingRequestId, 'High-risk files.write paused for human approval');

  // Test 4: Memory Subsystem
  console.log('\n[TEST GROUP 4] Cognitive Memory (create/read/search/update/delete/export):');
  const mem = memorySubsystem.create('task', 'Test Task', 'Running unit test assertion', ['test'], 0.9);
  assert(mem.id.startsWith('mem-'), 'Memory created with unique ID');

  const readMem = memorySubsystem.read(mem.id);
  assert(readMem?.title === 'Test Task', 'Memory read returns created item');

  const searchRes = memorySubsystem.search('assertion');
  assert(searchRes.length > 0 && searchRes[0].id === mem.id, 'Memory search correctly indexes keywords');

  const updatedMem = memorySubsystem.update(mem.id, { title: 'Updated Title' });
  assert(updatedMem?.title === 'Updated Title', 'Memory update modifies attributes');

  const exported = memorySubsystem.export();
  assert(exported.records.length > 0, 'Memory export yields valid JSON snapshot');

  const deleted = memorySubsystem.delete(mem.id);
  assert(deleted, 'Memory delete removes record');

  // Test 5: Skills Subsystem
  console.log('\n[TEST GROUP 5] Skills Subsystem:');
  const skills = skillsSubsystem.list();
  assert(skills.length >= 4, 'Native skills loaded (sysops, filesystem, devops, cyber_analyst)');

  const regResult = skillsSubsystem.register({
    name: 'custom.test_skill',
    version: '1.0.0',
    capabilities: ['custom.cap'],
    tools: ['custom.tool'],
    permissions: ['custom:perm'],
  });
  assert(regResult.success, 'New skill manifest passes validation and registers');

  // Test 6: Secure Tool Subsystem
  console.log('\n[TEST GROUP 6] Secure Tool Subsystem:');
  const sysInfo = await toolSubsystem.execute('unit-test', 'system.info', {}, true);
  assert(sysInfo.success, 'system.info executes successfully');

  const procList = await toolSubsystem.execute('unit-test', 'process.list', {}, true);
  assert(procList.success, 'process.list executes successfully');

  const fileRead = await toolSubsystem.execute('unit-test', 'files.read', { path: '/etc/m4/motd' }, true);
  assert(fileRead.success, 'files.read reads virtual filesystem');

  // Test 7: Agent Subsystem
  console.log('\n[TEST GROUP 7] Autonomous Agent Subsystem:');
  const task = await agentSubsystem.runTask('system_agent', 'audit process load');
  assert(task.id.startsWith('task-'), 'Agent task spawned with valid task ID');
  assert(task.plan.length > 0, 'Agent generated multi-step plan');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
