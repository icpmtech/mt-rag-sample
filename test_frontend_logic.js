/**
 * Test to verify SharePoint URL detection and processing in frontend
 */

// Simulate the getCitationFilePath logic
function getCitationFilePath(citation, citationLookup) {
  const cleanedCitation = citation.replace(/\s*\(.*?\)\s*$/, "").trim();

  if (citationLookup && citationLookup[citation]) {
    const url = citationLookup[citation];
    return processStorageUrl(url, citation);
  }

  if (citationLookup && citationLookup[cleanedCitation]) {
    const url = citationLookup[cleanedCitation];
    return processStorageUrl(url, citation);
  }

  // Check if the citation itself is a SharePoint URL (not in lookup)
  if (cleanedCitation.includes("sharepoint.com")) {
    return processStorageUrl(cleanedCitation, citation);
  }

  return `/content/${cleanedCitation}`;
}

function processStorageUrl(url, originalCitation) {
  if (url.includes("sharepoint.com")) {
    const pageMatch = originalCitation.match(/#page=(\d+)/);
    const finalUrl =
      pageMatch && !url.includes("#page=")
        ? `${url}#page=${pageMatch[1]}`
        : url;
    return `sharepoint:${finalUrl}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const pageMatch = originalCitation.match(/#page=(\d+)/);
    if (pageMatch && !url.includes("#page=")) {
      return `${url}#page=${pageMatch[1]}`;
    }
    return url;
  }

  const pageMatch = originalCitation.match(/#page=(\d+)/);
  const baseUrl = `/content/${url}`;
  if (pageMatch) {
    return `${baseUrl}#page=${pageMatch[1]}`;
  }
  return baseUrl;
}

// Test cases
console.log("Testing SharePoint URL detection and processing...\n");

const testCases = [
  {
    name: "Direct SharePoint URL without lookup",
    citation:
      "https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf",
    citationLookup: {},
    expected:
      "sharepoint:https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf",
  },
  {
    name: "SharePoint URL with page number",
    citation:
      "https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf#page=5",
    citationLookup: {},
    expected:
      "sharepoint:https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf#page=5",
  },
  {
    name: "SharePoint URL in lookup",
    citation: "CASH.pdf",
    citationLookup: {
      "CASH.pdf":
        "https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf",
    },
    expected:
      "sharepoint:https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf",
  },
  {
    name: "Local blob storage file",
    citation: "document.pdf",
    citationLookup: {},
    expected: "/content/document.pdf",
  },
  {
    name: "Blob storage URL",
    citation: "file.pdf",
    citationLookup: {
      "file.pdf": "https://mystorage.blob.core.windows.net/container/file.pdf",
    },
    expected: "https://mystorage.blob.core.windows.net/container/file.pdf",
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = getCitationFilePath(test.citation, test.citationLookup);
  const success = result === test.expected;

  if (success) {
    console.log(`✓ Test ${index + 1}: ${test.name}`);
    console.log(`  Citation: ${test.citation}`);
    console.log(`  Result: ${result}`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1}: ${test.name}`);
    console.log(`  Citation: ${test.citation}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got: ${result}`);
    failed++;
  }
  console.log();
});

console.log("=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

// Test the fetch logic
console.log("\nTesting fetch logic simulation:\n");

const testUrl =
  "sharepoint:https://claranetapplications.sharepoint.com/sites/IT/LIST/CASH.pdf";

if (testUrl.startsWith("sharepoint:")) {
  const sharePointUrl = testUrl.substring("sharepoint:".length);
  console.log("✓ Detected SharePoint URL");
  console.log(`  Would fetch from: POST /sharepoint/content`);
  console.log(`  With body: { url: "${sharePointUrl}" }`);
  console.log(`  This will use Graph API to download the document`);
} else {
  console.log("✗ Would use regular fetch");
  console.log(`  GET ${testUrl}`);
}

console.log("\n✓ All frontend logic tests completed!");
