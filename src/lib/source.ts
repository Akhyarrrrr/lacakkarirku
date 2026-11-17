function matchesDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

export function inferJobSource(link: string) {
  try {
    const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");

    if (matchesDomain(host, "linkedin.com")) return "LinkedIn";
    if (matchesDomain(host, "jobstreet.co.id")) return "JobStreet";
    if (matchesDomain(host, "glints.com")) return "Glints";
    if (matchesDomain(host, "upwork.com")) return "Upwork";
    if (matchesDomain(host, "remoteok.com")) return "RemoteOK";
    if (matchesDomain(host, "weworkremotely.com")) return "WeWorkRemotely";
    if (matchesDomain(host, "google.com")) return "Google";

    return host;
  } catch {
    return "Manual";
  }
}
