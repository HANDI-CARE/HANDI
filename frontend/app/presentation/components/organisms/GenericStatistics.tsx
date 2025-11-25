import { Card, Col, Row } from "antd";
import { Statistic } from "../atoms";

interface StatisticItem {
  title: string;
  value: number;
  color: string;
}

interface GenericStatisticsProps {
  title: string;
  statistics: StatisticItem[];
}

export default function GenericStatistics({
  title,
  statistics,
}: GenericStatisticsProps) {
  return (
    <div className="mt-8">
      <Card
        title={<span className="text-lg font-semibold">{title}</span>}
        styles={{ body: { padding: "24px" } }}
      >
        <Row gutter={[24, 24]}>
          {statistics.map((stat, index) => (
            <Col span={6} key={index}>
              <div className="text-center">
                <Statistic
                  title={
                    <span className="text-base text-gray-700">
                      {stat.title}
                    </span>
                  }
                  value={stat.value}
                  valueStyle={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: stat.color,
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
