/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert");

// Validates inquiry status transitions according to the SQL trigger in 20261023000001_functions_and_triggers.sql
function validateStatusTransition(oldStatus, newStatus) {
  if (oldStatus === newStatus) {
    return true; // e.g. updating admin_notes without changing status
  }

  if (oldStatus === "new" && ["reviewing", "accepted", "declined"].includes(newStatus)) {
    return true;
  }
  if (oldStatus === "reviewing" && ["accepted", "declined"].includes(newStatus)) {
    return true;
  }
  if (oldStatus === "accepted" && ["reviewing", "declined", "completed"].includes(newStatus)) {
    return true;
  }
  if (oldStatus === "declined" && newStatus === "reviewing") {
    return true;
  }
  if (oldStatus === "completed" && newStatus === "accepted") {
    return true;
  }

  return false;
}

function runTests() {
  console.log("Starting Commission Inquiry Lifecycle State Transition Tests...");

  // Permitted transitions
  assert(validateStatusTransition("new", "reviewing"), "new -> reviewing should be allowed");
  assert(validateStatusTransition("new", "accepted"), "new -> accepted should be allowed");
  assert(validateStatusTransition("new", "declined"), "new -> declined should be allowed");
  assert(validateStatusTransition("reviewing", "accepted"), "reviewing -> accepted should be allowed");
  assert(validateStatusTransition("reviewing", "declined"), "reviewing -> declined should be allowed");
  assert(validateStatusTransition("accepted", "reviewing"), "accepted -> reviewing should be allowed");
  assert(validateStatusTransition("accepted", "declined"), "accepted -> declined should be allowed");
  assert(validateStatusTransition("accepted", "completed"), "accepted -> completed should be allowed");
  assert(validateStatusTransition("declined", "reviewing"), "declined -> reviewing should be allowed");
  assert(validateStatusTransition("completed", "accepted"), "completed -> accepted should be allowed");
  assert(validateStatusTransition("reviewing", "reviewing"), "same status (notes update) should be allowed");
  console.log("✓ All 11 permitted transitions verified!");

  // Forbidden transitions
  assert(!validateStatusTransition("new", "completed"), "new -> completed MUST be forbidden");
  assert(!validateStatusTransition("reviewing", "new"), "reviewing -> new MUST be forbidden");
  assert(!validateStatusTransition("reviewing", "completed"), "reviewing -> completed MUST be forbidden");
  assert(!validateStatusTransition("declined", "accepted"), "declined -> accepted MUST be forbidden");
  assert(!validateStatusTransition("declined", "completed"), "declined -> completed MUST be forbidden");
  assert(!validateStatusTransition("declined", "new"), "declined -> new MUST be forbidden");
  assert(!validateStatusTransition("completed", "reviewing"), "completed -> reviewing MUST be forbidden");
  assert(!validateStatusTransition("completed", "declined"), "completed -> declined MUST be forbidden");
  assert(!validateStatusTransition("completed", "new"), "completed -> new MUST be forbidden");
  console.log("✓ All 9 forbidden transition invariants verified!");

  console.log("\nALL INQUIRY LIFECYCLE TESTS PASSED!");
}

runTests();
