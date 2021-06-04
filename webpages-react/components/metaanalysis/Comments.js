import React, { useState, useContext } from 'react';
import { formatDateTimeSplit } from '../../tools/datatools';
import UserContext from './UserContext';

function getComments(comments, cellId) {
  if (comments[cellId]) {
    return comments[cellId];
  } else { return null; }
}

function CommentDisplay(props) {
  const { cellComments, activeCommentState } = props;
  const [activeComment, setActiveComment] = activeCommentState;
  let index = 0;
  if (cellComments) {
    for (let i = 0; i < Object.keys(cellComments).length; i += 1) {
      if (cellComments[i] === activeComment) {
        index = i;
      }
    }
  }
  setActiveComment(cellComments[index]);

  function scrollLeft() {
    if (cellComments[index - 1]) {
      index -= 1;
    }
    setActiveComment(cellComments[index]);
  }
  function scrollRight() {
    if (cellComments[index + 1]) {
      index += 1;
    }
    setActiveComment(cellComments[index]);
  }

  return (
    <>
      <div
        role="button"
        tabIndex="0"
        onClick={cellComments[index - 1] ? scrollLeft : null}
        onKeyDown={cellComments[index - 1] ? scrollLeft : null}
        className={cellComments[index - 1] ? 'activeCommentScroller leftCommentScroller' : 'inactiveCommentScroller leftCommentScroller'}
      >
        <img
          src="/img/left-arrow-icon.png"
          alt="scroll left"
          className={cellComments[index - 1] ? 'activeCommentScroller' : 'inactiveCommentScroller'}
        />
      </div>
      <div className="commentContent">
        <p>
          Posted by
          { ' ' }
          { activeComment.user }
          { ' ' }
          at
          { ' ' }
          { formatDateTimeSplit(activeComment.ctime).time }
          { ' ' }
          on
          { ' ' }
          { formatDateTimeSplit(activeComment.ctime).date }
          { ' ' }
        </p>
        <p>{ activeComment.text }</p>
      </div>
      <div
        role="button"
        tabIndex="0"
        onClick={cellComments[index + 1] ? scrollRight : null}
        onKeyDown={cellComments[index + 1] ? scrollRight : null}
        className={cellComments[index + 1] ? 'activeCommentScroller rightCommentScroller' : 'inactiveCommentScroller rightCommentScroller'}
      >
        <img
          src="/img/right-arrow-icon.png"
          alt="scroll left"
          className={cellComments[index + 1] ? 'activeCommentScroller' : 'inactiveCommentScroller'}
        />
      </div>
    </>
  );
}

function PostComment(props) {
  const {
    cellDetails,
    cellComments,
    commentState,
    commentFlag,
  } = props;
  const [flag, setFlag] = commentFlag;
  const [comments, setComments] = commentState;
  const currentUser = useContext(UserContext);
  let inputValue;

  function toggleFlag() {
    setFlag(!flag);
  }

  function handleChange(e) {
    inputValue = e.target.value;
  }

  function handleSubmit() {
    let index;
    const newTime = new Date().getTime();

    const newComment = {
      user: currentUser.displayName,
      ctime: newTime,
      cellId: cellDetails.cellId,
      text: inputValue,
    };
    toggleFlag();

    function handleComments() {
      if (!cellComments) {
        return { 0: newComment };
      } else {
        index = Object.keys(cellComments).length;
        cellComments[index] = newComment;
        return cellComments;
      }
    }
    const tempComments = { ...comments };
    if (inputValue.replace(/\s/g, '')) tempComments[cellDetails.cellId] = handleComments();
    setComments(tempComments);
  }

  if (flag) {
    return (
      <>
        <div className="postCommentActive">
          <div
            role="button"
            tabIndex="0"
            onClick={toggleFlag}
            onKeyDown={toggleFlag}
            className="postCommentClose"
          >
            x
          </div>
          <form onSubmit={handleSubmit}>
            <textarea
              rows="4"
              placeholder="Type your comment"
              value={inputValue}
              onChange={handleChange}
              className="postCommentInput"
            />
            <input
              type="submit"
              value="Post Comment"
              className="postCommentSubmit"
            />
          </form>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div
          role="button"
          tabIndex="0"
          onClick={toggleFlag}
          onKeyDown={toggleFlag}
          className="postCommentInactive"
        >
          Post a comment
        </div>
      </>
    );
  }
}

function Comments(props) {
  const { cellDetails, commentFlag, commentState } = props;
  const [comments] = commentState;
  const cellComments = getComments(comments, cellDetails.cellId);
  const [activeComment, setActiveComment] = useState([]);
  const currentUser = useContext(UserContext);
  const [flag] = commentFlag;
  return (
    <div className="commentContainer">
      <div className="commentHolderOuter">
        Comments
        <div className="commentHolderInner">
          <div className="commentText">
            { !flag && cellComments
              ? (
                <CommentDisplay
                  cellComments={cellComments}
                  activeCommentState={[activeComment, setActiveComment]}
                />
              )
              : null }
            { !cellComments
              ? (
                <p>
                  No comments to display
                </p>
              )
              : null }
          </div>
          <div className="postComment">
            { currentUser
              ? (
                <PostComment
                  cellDetails={cellDetails}
                  cellComments={cellComments}
                  commentState={commentState}
                  commentFlag={commentFlag}
                />
              )
              : null }
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comments;
