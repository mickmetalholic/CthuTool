import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");

type ArgoApplication = {
  readonly metadata?: {
    readonly name?: string;
  };
  readonly spec?: {
    readonly source?: {
      readonly chart?: string;
      readonly helm?: {
        readonly releaseName?: string;
        readonly values?: string;
      };
      readonly repoURL?: string;
      readonly targetRevision?: string;
    };
  };
};

type BackendConfigMap = {
  readonly data?: Record<string, string>;
};

function readApplication(path: string): ArgoApplication {
  return parseYaml(readFileSync(join(root, path), "utf8")) as ArgoApplication;
}

function readHelmValues(path: string): Record<string, unknown> {
  const app = readApplication(path);
  const values = app.spec?.source?.helm?.values;
  expect(values).toEqual(expect.any(String));
  return parseYaml(values ?? "") as Record<string, unknown>;
}

describe("observability tracing stack contract", () => {
  it("declares Tempo and OpenTelemetry Collector applications", () => {
    const tempo = readApplication(
      "gitops/apps/observability-tempo/application.yaml",
    );
    const collector = readApplication(
      "gitops/apps/observability-otel-collector/application.yaml",
    );

    expect(tempo).toMatchObject({
      metadata: { name: "observability-tempo" },
      spec: {
        source: {
          chart: "tempo",
          repoURL: "https://grafana.github.io/helm-charts",
          targetRevision: "1.24.4",
        },
      },
    });
    expect(collector).toMatchObject({
      metadata: { name: "observability-otel-collector" },
      spec: {
        source: {
          chart: "opentelemetry-collector",
          repoURL: "https://open-telemetry.github.io/opentelemetry-helm-charts",
          targetRevision: "0.159.0",
        },
      },
    });
  });

  it("routes collector OTLP traces to Tempo only", () => {
    const values = readHelmValues(
      "gitops/apps/observability-otel-collector/application.yaml",
    );
    const serialized = JSON.stringify(values);

    expect(serialized).toContain('"otlp"');
    expect(serialized).toContain('"0.0.0.0:4317"');
    expect(serialized).toContain('"0.0.0.0:4318"');
    expect(serialized).toContain("http://tempo.observability.svc.cluster.local:4318");
    expect(serialized).toContain('"traces"');
    expect(serialized).not.toContain('"metrics"');
    expect(serialized).not.toContain('"logs"');
  });

  it("configures Grafana Tempo data source", () => {
    const values = readHelmValues(
      "gitops/apps/observability-kube-prometheus-stack/application.yaml",
    );
    const datasources =
      (
        values.grafana as {
          readonly additionalDataSources?: readonly Record<string, unknown>[];
        }
      ).additionalDataSources ?? [];

    expect(datasources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Tempo",
          type: "tempo",
          uid: "tempo",
          url: "http://tempo.observability.svc.cluster.local:3100",
        }),
      ]),
    );
  });

  it("configures backend OTLP trace export without moving metrics or logs", () => {
    const config = parseYaml(
      readFileSync(join(root, "k8s/configmap.yaml"), "utf8"),
    ) as BackendConfigMap;

    expect(config.data).toMatchObject({
      OTEL_EXPORTER_OTLP_ENDPOINT:
        "http://otel-collector.observability.svc.cluster.local:4318",
      OTEL_LOGS_EXPORTER: "none",
      OTEL_METRICS_EXPORTER: "none",
      OTEL_SERVICE_NAME: "cthutool-backend",
      OTEL_TRACES_EXPORTER: "otlp",
    });
  });
});
