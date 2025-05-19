"use client";

import _ from "lodash";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
} from "recharts";

import { BarList, BarListData, Chart, useChart } from "@chakra-ui/charts";
import { Box, Flex, Table, Text } from "@chakra-ui/react";

import { CloseButton } from "@/components/ui/close-button";
import { useColorModeValue } from "@/components/ui/color-mode";
import useRewards from "@/hooks/useRewards";
import useRewardsList from "@/hooks/useRewardsList";
import useUser from "@/hooks/useUser";
import { IRewardItem, RewardType, Role } from "@/interfaces";
import { truncateAddress } from "@/utils";

export default function PlaygroundPage() {
  const router = useRouter();
  const { user } = useUser();
  const { rewards } = useRewards();
  const { rewardsList } = useRewardsList();

  const rewardsHistory = useMemo(() => {
    const groupedHistory = _.groupBy(rewards.history, (item) =>
      new Date(item.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    );

    const history: {
      month: string;
      Invited: number;
      Earned: number;
      Claimed: number;
      Remaining: number;
    }[] = [];

    for (const key in groupedHistory) {
      const monthHistory = groupedHistory[key];

      const invited = monthHistory
        .filter(({ type }) => type == RewardType.INVITED)
        .reduce((acc, item) => acc + item.amount, 0);
      const claimed = monthHistory
        .filter(({ type }) => type == RewardType.CLAIMED)
        .reduce((acc, item) => acc + item.amount, 0);
      const earned = invited * 10 + Math.floor(invited / 10) * 100;
      const remaining = earned - claimed;

      history.push({
        month: key,
        Invited: invited,
        Earned: earned,
        Claimed: claimed,
        Remaining: remaining,
      });
    }

    return history;
  }, [rewards]);

  const barListData = useChart<BarListData>({
    sort: { by: "value", direction: "desc" },
    data: [
      { name: "Invited", value: rewards.referral_count },
      { name: "Earned", value: rewards.total_rewards },
      { name: "Claimed", value: rewards.claimed_rewards },
      { name: "Remaining", value: rewards.remaining_rewards },
    ],
    series: [{ name: "name", color: "teal.subtle" }],
  });

  const chart = useChart({
    data: rewardsHistory,
    series: [
      { name: "Invited", color: "teal.solid" },
      { name: "Earned", color: "purple.solid" },
      { name: "Claimed", color: "blue.solid" },
      { name: "Remaining", color: "green.solid" },
    ],
  });

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.200");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Box zIndex={1} px={4} py={12}>
      {user && user.role == Role.ADMIN ? (
        <Flex
          position="relative"
          px={6}
          py={12}
          direction="column"
          gap={2}
          bg={bgColor}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <CloseButton
            position="absolute"
            top={2}
            right={2}
            onClick={() => router.push("/")}
          />
          <Text color={textColor}>Rewards List</Text>
          <Table.ScrollArea maxW="full">
            <Table.Root>
              <Table.Header>
                <Table.Row color={textColor}>
                  <Table.Cell p={2}>Email</Table.Cell>
                  <Table.Cell p={2}>Address</Table.Cell>
                  <Table.Cell p={2}>Amount</Table.Cell>
                  <Table.Cell p={2}>Type</Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rewardsList.map((item: IRewardItem) => (
                  <Table.Row key={item.id} color={textColor}>
                    <Table.Cell p={2}>{item.users?.email}</Table.Cell>
                    <Table.Cell p={2}>
                      {truncateAddress(item.users?.publicKey)}
                    </Table.Cell>
                    <Table.Cell p={2}>{item.amount}</Table.Cell>
                    <Table.Cell p={2}>{item.type}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Flex>
      ) : (
        <Flex
          position="relative"
          px={6}
          py={12}
          direction={{ base: "column", md: "row" }}
          gap={4}
          bg={bgColor}
          rounded="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <CloseButton
            position="absolute"
            top={2}
            right={2}
            onClick={() => router.push("/")}
          />
          <BarList.Root
            w="100%"
            maxW="480px"
            chart={barListData}
            color={textColor}
          >
            <BarList.Content>
              <BarList.Bar />
              <BarList.Value />
            </BarList.Content>
          </BarList.Root>
          <Chart.Root flexGrow={{ md: 1 }} maxH="sm" chart={chart}>
            <AreaChart data={chart.data}>
              <CartesianGrid
                stroke={chart.color("border.muted")}
                vertical={false}
              />
              <XAxis
                axisLine={false}
                tickLine={false}
                dataKey={chart.key("month")}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Tooltip
                cursor={false}
                animationDuration={100}
                content={<Chart.Tooltip />}
              />
              <Legend content={<Chart.Legend />} />
              {chart.series.map((item) => (
                <Area
                  key={item.name}
                  isAnimationActive={false}
                  dataKey={chart.key(item.name)}
                  fill={chart.color(item.color)}
                  fillOpacity={0.2}
                  stroke={chart.color(item.color)}
                />
              ))}
            </AreaChart>
          </Chart.Root>
        </Flex>
      )}
    </Box>
  );
}
