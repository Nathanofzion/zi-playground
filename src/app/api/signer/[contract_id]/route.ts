import { NextRequest, NextResponse } from "next/server";

const mercuryProjectName = process.env.MERCURY_PROJECT_NAME!;
const mercuryUrl = process.env.MERCURY_URL!;
const mercuryJwt = process.env.MERCURY_JWT!;

export async function GET(
  _: NextRequest,
  { params: { contract_id } }: { params: { contract_id: string } }
) {
  try {
    const signers = await fetch(`${mercuryUrl}/zephyr/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercuryJwt}`
      },
      body: JSON.stringify({
        project_name: mercuryProjectName,
        mode: {
          Function: {
            fname: "get_signers_by_address",
            arguments: JSON.stringify({
              address: contract_id,
            }),
          },
        },
      }),
      cache: "no-store"
    }).then(async (res) => {
      if (res.ok) return res.json();
      throw await res.json();
    });
    return NextResponse.json(signers);
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
