<img src="https://s3.ap-northeast-2.amazonaws.com/mygit01/Fter+logo.png"></img>
# 기관
+ IT벤처 창업동아리 S.O.P.T
# 프로젝트명
+ Fter
# 프로젝트소개
+ 취업에 실패한 사람들을 위해 위로하고 공감할 수 있는 SNS
# 개발기간
+ 1개월
# 개발인원
+ 11명
# 역할
+ BACK-END 개발
# 개발언어
+ javascript
# 개발환경
+ Node.js Mysql AWS Slack Github
# 담당기술
1. ERD모델링을 통한 DB설계 및 관리
2. RESTful API 설계 및 문서작성
3. AWS ec2 사용
4. 대용량 파일 저장을 위한 AWS s3 사용
5. [계정관리] SNS의 계정관련 기능
 - 로컬로 따로 두지 않고 facebook 로그인 연동으로 인해 사용할 수 있게끔 구현
 - 각 사용자는 따로 닉네임, 파트, 상태메세지, 프로필사진 등의 프로필을 작성하도록 기능 구현
 - 각 사용자는 자신이 찜한 글이나 쓴 글을 마이페이지 화면에서 한눈에 볼 수      있도록 구현
 - 개인정보는 수정가능하며 닉네임을 고유 값으로 두어 접근 및 변경을 제어함
6. [타임라인] Fter의 메인화면으로 타 SNS와 같이 여러 게시글이 업로드되는 화면
 - 최신순 또는 인기순으로 게시물 정렬
 - 자원을 그룹화 하기 위해 파트와 카테고리 2가지 묶음으로 그룹화
 - 특정 게시물을 클릭 시 게시글을 자세히 볼 수 있으며 댓글작성도 가능하도록 구현
 - 각 게시물에 좋아요 기능 구현
 - 각 게시물에 북마크 기능 구현
 - 원하는 키워드로 게시물을 검색할 수 있도록 검색기능 구현
7. [게시글] 게시글 작성 및 수정과 관련한 페이지
 - 기본적으로 게시물을 작성할 수 있으며 카테고리구분, 파트구분, 제목, 내용, 이미지등의 내용을 포함한다
 - 게시글 삭제는 게시글의 고유 ID와 삭제를 하려는 사용자의 닉네임을 활용하여 가능 여부 판단
8. [댓글] 각 게시물에 달리는 댓글기능
 - 타 SNS와 비슷하며 댓글을 모두보기할 시 최신순으로 나열됨
 - 타 SNS와 차별을 두어 해당 게시물에 관해 유용하다고 판단되는 댓글을 작성할 시 유용한 댓글에 체크를 하여 SNS에 접속하는 사용자들에게 더 편안한 기능을 제공
9. [알람기능]
 - 각 사용자는 알람을 받을 수 있다. 해당 경우로는 본인의 게시물에 좋아요,북마크 또는 댓글이 달렸을 때 알람이 가도록 기능 구현

<img src="https://s3.ap-northeast-2.amazonaws.com/mygit01/Fter3.jpg"></img>
