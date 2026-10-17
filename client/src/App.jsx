// 状態を持つ道具(useState)、表示後に処理を行う道具(useEffect)、値を覚えておく入れ物を作る道具(useRef)を読み込む
import { useEffect, useRef, useState } from 'react'
// 自分のサーバーの API を呼ぶ処理を読み込む
import { fetchTopics } from './api/topics.js'
import { fetchPosts } from './api/posts.js'
import { refreshTopic } from './api/refresh.js'
import { setFavorite, fetchFavorites } from './api/favorites.js'

// 画面の上部(サイト名、最終取得時刻、更新ボタン)の部品を読み込む
import Header from './components/Header.jsx'
// お気に入りのスライドの部品を読み込む
import FavoriteSlider from './components/FavoriteSlider.jsx'
// タブの部品を読み込む
import TopicTabs from './components/TopicTabs.jsx'
// 新しい投稿のお知らせの部品を読み込む
import NewPostsNotice from './components/NewPostsNotice.jsx'
// 「新しい投稿はありません」の表示の部品を読み込む
import RefreshMessage from './components/RefreshMessage.jsx'
// カード一覧の部品を読み込む
import PostList from './components/PostList.jsx'

// 「新しい投稿はありません」を表示しておく時間(ミリ秒)
const NO_NEW_POSTS_MS = 3000

// 取得のあとの最新の一覧(freshPosts)のうち、今の一覧(currentPosts)にまだない、新しい投稿を取り出す
// 最新の一覧を上から見ていき、今の一覧にある投稿が出てきたら、そこまでが新しい投稿
function findNewPosts(freshPosts, currentPosts) {
  const currentIds = new Set(currentPosts.map((post) => post.id))
  const firstKnownIndex = freshPosts.findIndex((post) => currentIds.has(post.id))

  // 今の一覧にある投稿が1つも出てこなければ、最新の一覧は、すべて新しい投稿
  return firstKnownIndex === -1 ? freshPosts : freshPosts.slice(0, firstKnownIndex)
}

// 今の一覧(currentList)に、新しい投稿(newPosts)を足した一覧を作る
// page は、取得のあとの最新の20件({ topicId, posts, hasMore })
function addNewPosts(currentList, page, newPosts) {
  // 新しい投稿が、最新の20件すべてだったとき(今の一覧とのあいだに、まだ読んでいない投稿がある)は、一覧を最新の20件に入れ替える
  // そうでなければ、新しい投稿を、今の一覧の上に足す
  const isAllNew = newPosts.length === page.posts.length
  return isAllNew
    ? { topicId: page.topicId, posts: page.posts, hasMore: page.hasMore }
    : { ...currentList, posts: [...newPosts, ...currentList.posts] }
}

// 画面全体をまとめる部品
function App() {
  // トピックの一覧(タブと、ヘッダーの最終取得時刻の元になる)
  const [topics, setTopics] = useState([])
  // 選択中のトピックの id(トピックが届くまでは null)
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  // 表示中の一覧(どのトピックの投稿か、投稿、続きがあるか)。3つをまとめて持ち、食い違わないようにする
  const [list, setList] = useState({ topicId: null, posts: [], hasMore: false })
  // 最初の20件を読み込み中か(開いた直後は読み込み中)
  const [isLoading, setIsLoading] = useState(true)
  // 読み込みに失敗したか
  const [isError, setIsError] = useState(false)
  // 「もっと見る」で読み込み中か
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // 次に読み込む投稿の指定({ topicId, offset })。これが変わるたびに読み込む
  const [request, setRequest] = useState(null)
  // 取得するトピックの指定({ topicId, isManual })。これが変わるたびに取得する
  // isManual は、更新ボタンからの取得なら true、自動の取得なら false
  const [refreshTarget, setRefreshTarget] = useState(null)
  // この回に、すでに取得を始めたトピックの id の一覧(同じタブに戻ったときに、もう一度取得しないため)
  const [refreshedTopicIds, setRefreshedTopicIds] = useState([])
  // 取得に失敗したトピックの id の一覧
  const [failedTopicIds, setFailedTopicIds] = useState([])
  // 取得のあとの、最新の20件({ topicId, posts, hasMore })。新しい投稿があるかを調べるのに使う
  const [freshPage, setFreshPage] = useState(null)
  // 表示の位置を合わせたい投稿の指定({ postId })。これが変わるたびに、その投稿が見える位置へ動かす
  const [scrollTarget, setScrollTarget] = useState(null)
  // 更新ボタンからの取得の最中か
  const [isRefreshing, setIsRefreshing] = useState(false)
  // 「新しい投稿はありません」を表示するトピックの指定({ topicId })。表示しないときは null
  const [noNewPostsNotice, setNoNewPostsNotice] = useState(null)
  // お気に入りにした投稿の一覧(トピックに関係なく、投稿日時の新しい順)
  const [favorites, setFavorites] = useState([])

  // 今の一覧を覚えておく入れ物(取得を待ったあとで、そのときの一覧を読むために使う)
  // 待つ前の list は、待っているあいだに古くなることがある(もっと見る、お知らせのタップ、タブの切り替え)
  const listRef = useRef(list)

  // 一覧が変わるたびに、入れ物の中身を新しくする
  useEffect(() => {
    listRef.current = list
  }, [list])

  // 開いたときに1回だけ:タブを表示し、先頭のトピックの保存済みの投稿をすぐ表示して、裏で取得を始める
  useEffect(() => {
    // 途中でこの画面が片付けられたら、結果を反映しないための目印
    let ignore = false

    fetchTopics()
      .then((loadedTopics) => {
        if (ignore) {
          return
        }
        const firstTopicId = loadedTopics[0].id
        setTopics(loadedTopics)
        setSelectedTopicId(firstTopicId)
        // 保存済みの投稿を、取得を待たずに読み込む
        setRequest({ topicId: firstTopicId, offset: 0 })
        // 裏で、このトピックの取得を始める
        setRefreshedTopicIds([firstTopicId])
        setRefreshTarget({ topicId: firstTopicId, isManual: false })
      })
      .catch((error) => {
        if (ignore) {
          return
        }
        // トピックが読めないと投稿も読めないので、失敗の案内を出す
        console.error(error.message)
        setIsError(true)
        setIsLoading(false)
      })

    // 片付けのときに目印を立てる
    return () => {
      ignore = true
    }
  }, [])

  // 開いたときに1回だけ:お気に入りの一覧を読み込む
  useEffect(() => {
    // 途中でこの画面が片付けられたら、結果を反映しないための目印
    let ignore = false

    fetchFavorites()
      .then((loadedFavorites) => {
        if (!ignore) {
          setFavorites(loadedFavorites)
        }
      })
      .catch((error) => {
        // 読めなかったときは、0件のまま(スライドを表示しない)にする
        console.error(error.message)
      })

    // 片付けのときに目印を立てる
    return () => {
      ignore = true
    }
  }, [])

  // 読み込みの指定(request)が変わるたびに、保存済みの投稿を読み込む
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
        setList((currentList) => ({
          topicId: request.topicId,
          posts: request.offset === 0 ? data.posts : [...currentList.posts, ...data.posts],
          hasMore: data.has_more,
        }))
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

  // 取得の指定(refreshTarget)が変わるたびに、そのトピックを取得する(自動の取得も、更新ボタンからの取得も、ここで行う)
  // 途中でタブを切り替えても、最後まで行う(結果はトピックごとに記録するので、別のタブの表示を壊さない)
  useEffect(() => {
    // まだ指定がなければ、何もしない
    if (refreshTarget === null) {
      return
    }

    const topicId = refreshTarget.topicId
    const isManual = refreshTarget.isManual

    // 順番に待ちながら進めるため、async の関数にまとめる
    async function runRefresh() {
      // ① このトピックの新しい投稿を取りに行く
      let isFailed = false
      try {
        await refreshTopic(topicId)
      } catch (error) {
        console.error(error.message)
        isFailed = true
      }

      // 取得に失敗したトピックとして記録する。成功したら、記録から外す
      setFailedTopicIds((currentIds) => {
        const otherIds = currentIds.filter((id) => id !== topicId)
        return isFailed ? [...otherIds, topicId] : otherIds
      })

      // ② トピックの一覧を受け取り直して、最終取得時刻を新しくする
      try {
        const refreshedTopics = await fetchTopics()
        setTopics(refreshedTopics)
      } catch (error) {
        console.error(error.message)
      }

      // 取得に失敗したときは、ここで終わる
      if (isFailed) {
        return
      }

      // ③ 取得のあとの、最新の20件を読む
      try {
        const data = await fetchPosts(topicId, 0)
        const page = { topicId, posts: data.posts, hasMore: data.has_more }

        // 自動の取得のとき:お知らせを出せるようにする
        if (!isManual) {
          // 新しい投稿があるかを調べられるよう、最新の20件を覚えておく
          setFreshPage(page)

          // 今このトピックを表示していて、表示が0件のときだけ、自動的に表示する
          setList((currentList) =>
            currentList.topicId === topicId && currentList.posts.length === 0 ? page : currentList,
          )
          return
        }

        // ここから下は、更新ボタンからの取得のとき:お知らせをはさまずに表示する
        // 待っているあいだに変わっているかもしれないので、今の一覧を入れ物から読む
        const currentList = listRef.current

        // 待っているあいだに別のタブへ切り替えていたら、何もしない
        if (currentList.topicId !== topicId) {
          return
        }

        const newPosts = findNewPosts(page.posts, currentList.posts)

        // 新しい投稿がなければ、そのことを短いあいだ表示する
        if (newPosts.length === 0) {
          setNoNewPostsNotice({ topicId })
          return
        }

        // 新しい投稿を一覧に足し、出しそびれていたお知らせがあれば消す
        setList(addNewPosts(currentList, page, newPosts))
        setFreshPage(null)

        // 新しく増えた投稿のうち、いちばん古いものの位置から表示する(表示が0件だったときは、上から表示するので動かさない)
        if (currentList.posts.length > 0) {
          setScrollTarget({ postId: newPosts[newPosts.length - 1].id })
        }
      } catch (error) {
        console.error(error.message)
      }
    }

    // 成功でも失敗でも、更新ボタンからの取得なら、終わったらボタンを押せるように戻す
    runRefresh().finally(() => {
      if (isManual) {
        setIsRefreshing(false)
      }
    })
  }, [refreshTarget])

  // 位置を合わせたい投稿の指定(scrollTarget)が変わるたびに、その投稿が画面の下のはしに来るように動かす
  // (その投稿より新しい投稿が、上に並んで見える。そこから上へ読み進められる)
  useEffect(() => {
    if (scrollTarget === null) {
      return
    }
    const element = document.getElementById(`post-${scrollTarget.postId}`)
    if (element) {
      element.scrollIntoView({ block: 'end' })
    }
  }, [scrollTarget])

  // 「新しい投稿はありません」の指定(noNewPostsNotice)が入るたびに、決めた時間のあとで消す
  useEffect(() => {
    if (noNewPostsNotice === null) {
      return
    }
    const timerId = setTimeout(() => {
      setNoNewPostsNotice(null)
    }, NO_NEW_POSTS_MS)

    // 片付けのとき(消える前に、次の指定が入ったときなど)は、前のタイマーを止める
    return () => {
      clearTimeout(timerId)
    }
  }, [noNewPostsNotice])

  // タブが押されたとき
  function handleSelectTopic(topicId) {
    // 選択中のタブをもう一度押したときは、何もしない
    if (topicId === selectedTopicId) {
      return
    }
    // 表示を空にして「読み込み中」にし、押されたトピックの保存済みの投稿を読み込む
    setSelectedTopicId(topicId)
    setList({ topicId, posts: [], hasMore: false })
    setIsError(false)
    setIsLoading(true)
    setIsLoadingMore(false)
    setRequest({ topicId, offset: 0 })

    // この回に初めて開いたタブなら、裏で取得を始める(すでに開いたことのあるタブでは、取得しない)
    if (!refreshedTopicIds.includes(topicId)) {
      setRefreshedTopicIds([...refreshedTopicIds, topicId])
      setRefreshTarget({ topicId, isManual: false })
    }
  }

  // 「もっと見る」が押されたとき
  function handleLoadMore() {
    // ボタンを「読み込み中」にし、今表示している件数の続きから読み込む
    setIsError(false)
    setIsLoadingMore(true)
    setRequest({ topicId: selectedTopicId, offset: list.posts.length })
  }

  // 更新ボタンが押されたとき
  function handleRefresh() {
    // ボタンを「更新中」にして押せなくし、前の「新しい投稿はありません」が残っていれば消す
    setIsRefreshing(true)
    setNoNewPostsNotice(null)
    // 開いているトピックを、更新ボタンからの取得として取りに行く
    setRefreshTarget({ topicId: selectedTopicId, isManual: true })
  }

  // カードのお気に入りのボタンが押されたとき(postId の投稿を、isFavorite の状態に変える)
  // 一覧のカードからも、スライドのカードからも呼ばれる
  // 成功したら true、失敗したら false を返す(失敗の知らせは、押されたカードが出す)
  async function handleToggleFavorite(postId, isFavorite) {
    let result
    try {
      result = await setFavorite(postId, isFavorite)
    } catch (error) {
      console.error(error.message)
      return false
    }

    // 返事を受け取ってから、一覧の中の、その投稿のお気に入りの印を書き換える
    // 待っているあいだに一覧が変わっているかもしれないので、そのときの一覧(currentList)をもとにする
    setList((currentList) => ({
      ...currentList,
      posts: currentList.posts.map((post) =>
        post.id === result.id ? { ...post, is_favorite: result.is_favorite } : post,
      ),
    }))

    // お気に入りの一覧を読み直して、スライドに反映する(並び順は、返ってきた順のまま使う)
    // 変更そのものは成功しているので、読み直しに失敗しても true を返す(次に読み直したときに反映される)
    try {
      const loadedFavorites = await fetchFavorites()
      setFavorites(loadedFavorites)
    } catch (error) {
      console.error(error.message)
    }
    return true
  }

  // 今見ているトピックの、まだ表示していない新しい投稿(なければ空の配列)
  // 表示が0件のときは、自動的に表示するので、お知らせの対象にしない
  const newPosts =
    freshPage !== null && freshPage.topicId === list.topicId && list.posts.length > 0
      ? findNewPosts(freshPage.posts, list.posts)
      : []

  // 「最新の投稿があります」が押されたとき
  function handleShowNewPosts() {
    // 新しい投稿を、今の一覧に足す
    setList(addNewPosts(list, freshPage, newPosts))

    // 新しく増えた投稿のうち、いちばん古いもの(並びのいちばん下)の位置から表示する
    setScrollTarget({ postId: newPosts[newPosts.length - 1].id })

    // お知らせを消す
    setFreshPage(null)
  }

  // 選択中のトピック(トピックがまだ届いていなければ undefined)
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId)

  // 「取得に失敗しました」を出すか:選択中のトピックの取得が失敗したとき
  const isRefreshError = failedTopicIds.includes(selectedTopicId)

  // 「新しい投稿はありません」を出すか:選択中のトピックについての指定が入っているとき
  const isNoNewPostsShown = noNewPostsNotice !== null && noNewPostsNotice.topicId === selectedTopicId

  return (
    <div className="app">
      {/* 画面の上部(選択中のトピックの最終取得時刻と、更新ボタンの状態・押されたときの処理を渡す) */}
      <Header
        lastFetchedAt={selectedTopic?.last_fetched_at}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* お気に入りのスライド(0件のときは、部品の中で何も表示しない) */}
      <FavoriteSlider posts={favorites} onToggleFavorite={handleToggleFavorite} />

      {/* タブ(選択中の id と、押されたときの処理を渡す) */}
      <TopicTabs
        topics={topics}
        selectedTopicId={selectedTopicId}
        onSelect={handleSelectTopic}
      />

      {/* 取得に失敗したときの案内(保存済みの投稿は、下にそのまま表示する) */}
      {isRefreshError && <p className="app-notice">取得に失敗しました</p>}

      {/* 新しい投稿があるときのお知らせ(一覧に重ねて表示する) */}
      {newPosts.length > 0 && <NewPostsNotice onShow={handleShowNewPosts} />}

      {/* 更新ボタンを押して、新しい投稿がなかったときの表示(一覧に重ねて、短いあいだ表示する) */}
      {isNoNewPostsShown && <RefreshMessage />}

      {/* カード一覧(投稿と、読み込みの状態と、「もっと見る」・お気に入りの処理を渡す) */}
      <PostList
        posts={list.posts}
        isLoading={isLoading}
        isError={isError}
        hasMore={list.hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  )
}

// main.jsx から読み込めるようにする
export default App
