import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");

type ArgoApplication = {
  readonly spec?: {
    readonly source?: {
      readonly helm?: {
        readonly values?: string;
      };
    };
  };
};

type PrometheusRule = {
  readonly alert?: string;
  readonly expr?: string;
  readonly for?: string;
};

type PrometheusValues = {
  readonly additionalPrometheusRulesMap?: {
    readonly "cthutool-backend"?: {
      readonly groups?: readonly {
        readonly name?: string;
        readonly rules?: readonly PrometheusRule[];
      }[];
    };
  };
  readonly alertmanager?: {
    readonly enabled?: boolean;
  };
};

function readObservabilityValues(): PrometheusValues {
  const raw = readFileSync(
    join(
      root,
      "gitops/apps/observability-kube-prometheus-stack/application.yaml",
    ),
    "utf8",
  );
  const app = parseYaml(raw) as ArgoApplication;
  const values = app.spec?.source?.helm?.values;
  expect(values).toEqual(expect.any(String));
  return parseYaml(values ?? "") as PrometheusValues;
}

describe("observability alert rules contract", () => {
  it("defines CthuTool backend alert rules through kube-prometheus-stack values", () => {
    const values = readObservabilityValues();
    const groups =
      values.additionalPrometheusRulesMap?.["cthutool-backend"]?.groups ?? [];
    const rules = groups.flatMap((group) => group.rules ?? []);
    const alerts = rules.map((rule) => rule.alert);

    expect(values.alertmanager?.enabled).toBe(true);
    expect(groups.map((group) => group.name)).toContain(
      "cthutool-backend.rules",
    );
    expect(alerts).toEqual(
      expect.arrayContaining([
        "CthuToolBackendTargetDown",
        "CthuToolBackendReadinessDegraded",
        "CthuToolBackendHighErrorRate",
        "CthuToolBackendHighP95Latency",
        "CthuToolBrowserTaskTimeouts",
        "CthuToolAgentCommandFailures",
      ]),
    );
  });

  it("uses expected bounded backend metric families in alert expressions", () => {
    const values = readObservabilityValues();
    const rules =
      values.additionalPrometheusRulesMap?.["cthutool-backend"]?.groups?.flatMap(
        (group) => group.rules ?? [],
      ) ?? [];
    const expressions = Object.fromEntries(
      rules.map((rule) => [rule.alert, rule.expr ?? ""]),
    );

    expect(expressions.CthuToolBackendTargetDown).toContain(
      'up{namespace="cthutool",service="cthutool-backend"}',
    );
    expect(expressions.CthuToolBackendReadinessDegraded).toContain(
      "cthutool_backend_readiness_status",
    );
    expect(expressions.CthuToolBackendHighErrorRate).toContain(
      "cthutool_backend_http_requests_total",
    );
    expect(expressions.CthuToolBackendHighP95Latency).toContain(
      "cthutool_backend_http_request_duration_seconds_bucket",
    );
    expect(expressions.CthuToolBrowserTaskTimeouts).toContain(
      "cthutool_backend_browser_task_total",
    );
    expect(expressions.CthuToolAgentCommandFailures).toContain(
      "cthutool_backend_agent_command_total",
    );
    expect(JSON.stringify(rules)).not.toContain("requestId");
    expect(JSON.stringify(rules)).not.toContain("traceId");
    expect(JSON.stringify(rules)).not.toContain("commandId");
  });
});
