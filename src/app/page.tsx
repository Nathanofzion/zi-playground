import Viewer from "@/components/Earth";
import { Grid } from "@chakra-ui/react";

export default function Home() {
  return (
    <Grid flex='1 1 0' templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}>
      <Viewer startAnimation />
    </Grid>
  );
}
