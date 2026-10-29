import { describe, expect, test } from "bun:test";
import { htmlToText, isPrivateAddress } from "@/lib/agent/fetch-page";

describe("isPrivateAddress", () => {
  test("blocks loopback, private, link-local and unspecified addresses", () => {
    for (const ip of ["127.0.0.1", "10.2.3.4", "172.16.0.9", "192.168.1.24", "169.254.169.254", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  test("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "140.82.112.3", "2606:4700::6810:84e5"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
});

describe("htmlToText", () => {
  test("drops scripts, styles and tags and keeps readable text", () => {
    const t = htmlToText("<html><head><style>x{}</style><script>alert(1)</script></head><body><h1>OAuth</h1><p>Create &amp; review</p></body></html>");
    expect(t).toContain("OAuth");
    expect(t).toContain("Create & review");
    expect(t).not.toContain("alert");
  });
});
