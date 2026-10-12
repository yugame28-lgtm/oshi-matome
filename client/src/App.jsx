// 状態を持つ道具(useState)と、表示後に処理を行う道具(useEffect)を読み込む
import { useEffect, useState } from 'react'
// API 1 を呼ぶ処理を読み込む
import { fetchTopics } from './api/topics.js'
// API 2 を呼ぶ処理を読み込む(仮→本物:dummyRefresh.js の代わり)
import { refreshPosts } from './api/refresh.js'
// API 3 を呼ぶ処理を読み込む
import { fetchPosts } from './api/posts.js'
// 画面の上部(サイト名と最終取得時刻)の部品を読み込む
import Header from './components/Header.jsx'
// タブの部品を読み込む
import TopicTabs from './components/TopicTabs.jsx'
// カード一覧の部品を読み込む
import PostList from './components/PostList.jsx'

// 画面全体をまとめる部品
function App() {
  // トピックの一覧(タブと、ヘッダーの最終取得時刻の元になる)
  const [topics, setTopics] = useState([])
  // 選択中のトピックの id(トピックが届くまでは null)
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  // 表示中の投稿
  const [posts, setPosts] = useState([])
  // 続きがあるか(「もっと見る」を出すかどうか)
  const [hasMore, setHasMore] = useState(false)
  // 最初の20件を読み込み中か(開いた直後は読み込み中)
  const [isLoading, setIsLoading] = useState(true)
  // 読み込みに失敗したか
  const [isError, setIsError] = useState(false)
  // 「もっと見る」で読み込み中か
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // 次に読み込む投稿の指定({ topicId, offset })。これが変わるたびに読み込む
  const [request, setRequest] = useState(null)
  // 取得(API 2)の呼び出しそのものが失敗したか
  const [isRefreshFailed, setIsRefreshFailed] = useState(false)
  // 取得に失敗したトピックの id の一覧(呼び出しは成功したが、結果が failed だったもの)
  const [failedTopicIds, setFailedTopicIds] = useState([])

  // 開いたときに1回だけ、タブの表示 → 取得 → 最終取得時刻の受け取り直し → 一覧の表示 を順に行う
  useEffect(() => {
    // 途中でこの画面が片付けられたら、それ以降の結果を反映しないための目印
    let ignore = false

    // 順番に待ちながら進めるため、async の関数にまとめる
    async function openSite() {
      // ① API 1:トピックの一覧を受け取り、タブを表示して、先頭(推しの投稿)を選ぶ
      let loadedTopics
      try {
        loadedTopics = await fetchTopics()
      } catch (error) {
        if (ignore) {
          return
        }
        // トピックが読めないと投稿も読めないので、失敗の案内を出して終わる
        console.error(error.message)
        setIsError(true)
        setIsLoading(false)
        return
      }
      if (ignore) {
        return
      }
      setTopics(loadedTopics)
      setSelectedTopicId(loadedTopics[0].id)

      // ② API 2:新しい投稿を取りに行く(この間、一覧は「読み込み中」のまま)
      try {
        const results = await refreshPosts()
        if (ignore) {
          return
        }
        // 結果が failed だったトピックの id だけを覚えておく
        setFailedTopicIds(
          results.filter((result) => result.status === 'failed').map((result) => result.topic_id),
        )
      } catch (error) {
        if (ignore) {
          return
        }
        // 取得に失敗しても止めずに、案内を出して先へ進む(保存済みの投稿は表示する)
        console.error(error.message)
        setIsRefreshFailed(true)
      }

      // ③ API 1 をもう一度:取得後の最終取得時刻を受け取り直す(①の時刻は取得前の値のため)
      try {
        const refreshedTopics = await fetchTopics()
        if (ignore) {
          return
        }
        setTopics(refreshedTopics)
      } catch (error) {
        if (ignore) {
          return
        }
        // 受け取り直しに失敗しても、①で受け取った一覧のまま先へ進む
        console.error(error.message)
      }

      // ④ API 3:選択中のタブの最初の20件を読み込む
      // 取得中にタブが押されていたら、そのタブを読み込み直す。押されていなければ先頭のタブを読み込む
      setRequest((currentRequest) => ({
        topicId: currentRequest === null ? loadedTopics[0].id : currentRequest.topicId,
        offset: 0,
      }))
    }

    openSite()

    // 片付けのときに目印を立てる
    return () => {
      ignore = true
    }
  }, [])

  // 読み込みの指定(request)が変わるたびに、投稿を読み込む
  useEffect(() => {
    // まだ指定がなければ、何もしない
    if (request === null) {
      return
    }

    // 途中で別の指定に変わったら、この結果を反映しないための目印
    let ignore = false

    fetchPosts(request.topicId, request.offset)
      .then((data) => {
        if (ignore) {
          return
        }
        // 0件目からなら入れ替え、それ以外(もっと見る)なら今の一覧の下に追加する
        setPosts((currentPosts) =>
          request.offset === 0 ? data.posts : [...currentPosts, ...data.posts],
        )
        setHasMore(data.has_more)
      })
      .catch((error) => {
        if (ignore) {
          return
        }
        console.error(error.message)
        setIsError(true)
      })
      .finally(() => {
        if (ignore) {
          return
        }
        // 成功でも失敗でも、読み込み中の表示を終える
        setIsLoading(false)
        setIsLoadingMore(false)
      })

    // 片付けのとき(次の指定に変わったとき)に目印を立てる
    return () => {
      ignore = true
    }
  }, [request])

  // タブが押されたとき
  function handleSelectTopic(topicId) {
    // 選択中のタブをもう一度押したときは、何もしない
    if (topicId === selectedTopicId) {
      return
    }
    // 表示を空にして「読み込み中」にし、押されたトピックの最初の20件を読み込む
    setSelectedTopicId(topicId)
    setPosts([])
    setHasMore(false)
    setIsError(false)
    setIsLoading(true)
    setIsLoadingMore(false)
    setRequest({ topicId, offset: 0 })
  }

  // 「もっと見る」が押されたとき
  function handleLoadMore() {
    // ボタンを「読み込み中」にし、今表示している件数の続きから読み込む
    setIsError(false)
    setIsLoadingMore(true)
    setRequest({ topicId: selectedTopicId, offset: posts.length })
  }

  // 選択中のトピック(トピックがまだ届いていなければ undefined)
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId)

  // 「取得に失敗しました」を出すか:呼び出しそのものが失敗したとき、または選択中のトピックの結果が failed のとき
  const isRefreshError = isRefreshFailed || failedTopicIds.includes(selectedTopicId)

  return (
    <div className="app">
      {/* 画面の上部(選択中のトピックの最終取得時刻を渡す。トピックがなければ undefined が渡る) */}
      <Header lastFetchedAt={selectedTopic?.last_fetched_at} />

      {/* タブ(選択中の id と、押されたときの処理を渡す) */}
      <TopicTabs
        topics={topics}
        selectedTopicId={selectedTopicId}
        onSelect={handleSelectTopic}
      />

      {/* 取得に失敗したときの案内(保存済みの投稿は、下にそのまま表示する) */}
      {isRefreshError && <p className="app-notice">取得に失敗しました</p>}

      {/* カード一覧(投稿と、読み込みの状態と、「もっと見る」の処理を渡す) */}
      <PostList
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

// main.jsx から読み込めるようにする
export default App
