import axios from "axios";

export const getPathaoToken = async () => {
  const res = await axios.post(
    `${process.env.PATHAO_BASE_URL}/aladdin/api/v1/issue-token`,
    {
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: "password",
    },
  );

  return res.data.access_token;
};
