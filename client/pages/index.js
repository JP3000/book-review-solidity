
import WrongNetworkMessage from '../components/WrongNetworkMessage'
import ConnectWalletButton from '../components/ConnectWalletButton'
import AddReviewForm from '../components/AddReviewForm'
import ReviewList from '../components/ReviewList'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import ReviewAbi from '../../backend/build/contracts/ReviewContract.json'
import { ReviewContractAddress } from '../config.js'

/* 
const tasks = [
  { id: 0, taskText: 'clean', isDeleted: false }, 
  { id: 1, taskText: 'food', isDeleted: false }, 
  { id: 2, taskText: 'water', isDeleted: true }
]
*/


export default function Home() {
  const [correctNetwork, setCorrectNetwork] = useState(false)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [currentAccount, setCurrentAccount] = useState('')
  const [reviews, setReviews] = useState([])
  const [selectedBookName, setSelectedBookName] = useState('')

  useEffect(() => {
    connectWallet()
  }, [])

  useEffect(() => {
    if (isUserLoggedIn && correctNetwork) {
      fetchMyReviews()
    }
  }, [isUserLoggedIn, correctNetwork])

  // 连接钱包
  const connectWallet = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        console.error('MetaMask not detected')
        return
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      setIsUserLoggedIn(true)
      setCurrentAccount(accounts[0])
      let chainId = await ethereum.request({ method: 'eth_chainId' })
      const sepoliaChainId = '0xaa36a7'
      if (chainId !== sepoliaChainId) {
        alert('you are not connected to the Sepolia testNet!')
        setCorrectNetwork(false)
        return
      } else {
        setCorrectNetwork(true)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  // 获取当前用户的书评
  const fetchMyReviews = async () => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          ReviewContractAddress,
          ReviewAbi.abi,
          signer
        )
        const data = await contract.getMyReviews()
        // r: [id, bookId, comment, isDeleted, upvotes, downvotes, rewarded]
        const parsed = data.map(r => ({
          id: Number(r.id || r[0]),
          bookId: r.bookId || r[1],
          comment: r.comment || r[2],
          isDeleted: r.isDeleted || r[3],
          upvotes: Number(r.upvotes || r[4]),
            downvotes: Number(r.downvotes || r[5]),
          rewarded: r.rewarded || r[6],
          owner: currentAccount
        }))
        setReviews(parsed)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 获取某本书的所有书评
  const fetchReviewsByBook = async (bookName) => {
    if (!bookName) return
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          ReviewContractAddress,
          ReviewAbi.abi,
          signer
        )
        const data = await contract.getReviewsByBook(bookName)
        const parsed = data.map(r => ({
          id: Number(r.id || r[0]),
          bookName: r.bookId || r.bookName || r[1],
          comment: r.comment || r[2],
          isDeleted: r.isDeleted || r[3],
          upvotes: Number(r.upvotes || r[4]),
          downvotes: Number(r.downvotes || r[5]),
          rewarded: r.rewarded || r[6],
          owner: null
        }))
        setReviews(parsed)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 添加书评
  const handleAddReview = async (bookName, comment) => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          ReviewContractAddress,
          ReviewAbi.abi,
          signer
        )
        const tx = await contract.addReview(bookName, comment)
        await tx.wait()
        fetchMyReviews()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 删除书评
  const handleDeleteReview = async (reviewId) => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          ReviewContractAddress,
          ReviewAbi.abi,
          signer
        )
        const tx = await contract.deleteReview(reviewId)
        await tx.wait()
        fetchMyReviews()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 点赞/点踩
  const handleVote = async (reviewId, isUpvote) => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          ReviewContractAddress,
          ReviewAbi.abi,
          signer
        )
        const tx = await contract.vote(reviewId, isUpvote)
        await tx.wait()
        // 投票后刷新当前书籍或我的书评
        if (selectedBookId) {
          fetchReviewsByBook(selectedBookId)
        } else {
          fetchMyReviews()
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 书名输入框变化
  const handleBookNameChange = (e) => {
    setSelectedBookName(e.target.value)
  }

  // 查询某本书的书评
  const handleSearchBook = () => {
    fetchReviewsByBook(selectedBookName)
  }

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-center bg-[#f7f7f7]"
      style={{minHeight:'100vh'}}
    >
      {/* 网站标题 */}
      {/* 顶部导航栏样式区 */}
      <div className="w-full flex justify-center mb-8 mt-8">
        <div className="db-card w-full max-w-3xl flex flex-col sm:flex-row items-center gap-4 p-4" style={{boxSizing:'border-box'}}>
          <div className="flex-1 flex items-center justify-center sm:justify-start">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{color:'var(--douban-green)',letterSpacing:'0.08em'}}>好评图书</span>
          </div>
          <div className="flex-[2] w-full flex flex-col sm:flex-row gap-3 items-center">
            <input
              className="db-input flex-1 text-lg h-12"
              style={{minWidth:0}}
              placeholder="输入书名，查询该书所有书评"
              value={selectedBookName}
              onChange={handleBookNameChange}
            />
            <button className="db-btn text-lg h-12 px-6" style={{background:'#888'}} onClick={handleSearchBook}>
              查询
            </button>
            <button className="db-btn text-lg h-12 px-6" style={{background:'#42bd56'}} onClick={fetchMyReviews}>
              我的书评
            </button>
          </div>
        </div>
      </div>
      <main className="w-full max-w-3xl flex flex-col items-center justify-center flex-1">
        { !isUserLoggedIn ? (
          <ConnectWalletButton connectWallet={connectWallet} />
        ) : !correctNetwork ? (
          <WrongNetworkMessage />
        ) : (
          <>
            {/* 发布书评大标题 */}
            <div className="w-full flex flex-col items-center mb-2">
              <div className="text-2xl font-bold text-center mb-2" style={{color:'var(--douban-green)'}}></div>
            </div>
            <AddReviewForm onAdd={handleAddReview} />
            <ReviewList
              reviews={reviews}
              onDelete={handleDeleteReview}
              onVote={handleVote}
              currentAccount={currentAccount}
            />
          </>
        )}
      </main>
    </div>
  )
}