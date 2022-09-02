import { useWeb3Contract } from "react-moralis"
import { abi, contractAddress } from "../constants/constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { Moralis } from "moralis"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const dispatch = useNotification()
    const chainId = parseInt(chainIdHex)
    const lotteryAddress = chainId in contractAddress ? contractAddress[chainId][0] : null
    console.log(lotteryAddress)
    const [entryFee, setEntryFee] = useState("0")
    const [numOfPlayers, setNumOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [provider, setProvider] = useState()
    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: entryFee,
    })

    const { runContractFunction: getNumOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getNumOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    const { runContractFunction: getEntryFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getEntryFee",
        params: {},
    })

    async function updateUI() {
        const lotteryEntryFee = (await getEntryFee()).toString()
        const lotteryNumOfPlayers = (await getNumOfPlayers()).toString()
        const lotteryRecentWinner = await getRecentWinner()
        setEntryFee(lotteryEntryFee)
        setNumOfPlayers(lotteryNumOfPlayers)
        setRecentWinner(lotteryRecentWinner)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
            const lotteryContract = new ethers.Contract(lotteryAddress, abi, provider.web3)
            lotteryContract.on("WinnerPicked", async () => {
                console.log("Winner Picked")
                updateUI()
            })
        }
        Moralis.onWeb3Enabled((provider) => {
            setProvider(provider)
        })
    }, [isWeb3Enabled])

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNotification(tx)
        updateUI()
    }

    const handleNotification = function (tx) {
        dispatch({
            type: "info",
            message: "Transaction Complete",
            title: "Transaction Notification",
            position: "topR",
            icon: "bell",
        })
    }
    return (
        <div className="p-5" style={{ width: "70%", margin: "auto", textAlign: "center" }}>
            <h1
                className="py-4 px-4 font-bold text-7xl mt-2"
                style={{ webkitTextStroke: "2px black" }}
            >
                Lottery
            </h1>
            {lotteryAddress ? (
                <>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 my-6 px-4 rounded ml-auto"
                        onClick={async () =>
                            await enterLottery({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            "Enter Raffle"
                        )}
                    </button>
                    <div>Entrance Fee: {ethers.utils.formatUnits(entryFee, "ether")} ETH</div>
                    <div>The current number of players is: {numOfPlayers}</div>
                    <div>The most previous winner was: {recentWinner}</div>
                </>
            ) : (
                <div>Please connect to a supported chain </div>
            )}
        </div>
    )
}
