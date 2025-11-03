const response = await fetch("https://api.thirdweb.com/v1/contracts/read", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-secret-key": "E9rDi-wGTZkArWajUkHvC7qJ5_abPv0QU3PixwcYsx1_ONn0trc82GuYLhnyW4HP_cBjo-pd0EJ0pAV9XnUCDQ",
  },
  body: JSON.stringify({
    calls: [
      {
        contractAddress: "0x794F944125da46E39810518fA72350563D7CB4E1",
        method: "function admin() view returns (address)",
        params: [],
      },
    ],
    chainId: 11155111,
  }),
});

const data = await response.json();

console.log("The data is: ",data);