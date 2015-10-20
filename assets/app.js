$(function () {
    window.App = {
        INSTA_CLIENT_ID: 'c12e8ff216fe48b8a2bd024c7c31c2f3',
        INSTA_REDIRECT_URI: window.location.origin,
        INSTA_JEN_ID: '212532892',
        INSTA_ALEX_ID: '1410763973',
        DAY_X: new Date('10-26-2013').getTime(),

        SLIDE_SCALE: 0.5,

        data: {
            user: null,
            media: [],
        },

        $cards: $(),
        $draggedCard: $(),

        score: 0,
        didMistake: false,
    }

    //checkLocationHashForToken()
    //var accessToken = getAccessToken()
    //if (!accessToken) login(App.INSTA_CLIENT_ID, App.INSTA_REDIRECT_URI)
    //
    //console.log('authenticated ', accessToken)
    //
    //fetchMediaWithAlex().then(function (media) {
    //    App.data.media = (media || []).sort(function (a, b) {
    //        return b.created_time - a.created_time
    //    })
    //
    //    $('#cards').append(App.data.media.map(function (aMedia) {
    //        return '<div class="card" data-time="' + aMedia.created_time + '"><img src="' + aMedia.images.standard_resolution.url+ '"/></div>'
    //    }).join(''))

        App.$cards = $('#cards .card')
        centerCards()
        order()
        setupFader()
        dropAll()

        //console.log(App.data.media)
    //}).catch(function (error) {
    //    console.error(error)
    //})

    $(window).on('resize', centerCards)


    $(document.body).on('dblclick', function (e) {
        if ($('#cards').is('.sorted')) dropAll()
        else if (!$('#cards').is('.playing')) startGame()
        else if (!$(e.target).closest('.card')[0]) finishGame()
    }).on('click', function (e) {
        if ($('#cards').is('.playing')) checkSelectedCard($(e.target).closest('.card')[0])
    }).on('mousedown', function (e) {
        if ($('#cards').is('.playing')) return

        App.$draggedCard = $(e.target).closest('.card')

        if (!App.$draggedCard[0]) return

        // allow to select only top card when they are sorted
        if ($('#cards').is('.sorted') && App.$draggedCard.css('zIndex') < App.$cards.length - 1) {
            App.$draggedCard = $()
            return false
        }

        var cardPosition = App.$draggedCard.css(['x', 'y'])
        App.$draggedCard.data('start', {
            mouse: {
                x: e.pageX,
                y: e.pageY,
            },
            card: {
                x: parseFloat(cardPosition.x),
                y: parseFloat(cardPosition.y),
            }
        })

        return false
    }).on('mousemove', function (e) {
        if (!App.$draggedCard[0]) return

        if (!$('#cards').is('.sorted')) showOnTop(App.$draggedCard[0])

        var start = App.$draggedCard.data('start')
        App.$draggedCard.css({
            x: start.card.x + (e.pageX - start.mouse.x),
            y: start.card.y + (e.pageY - start.mouse.y),
        })
    }).on('mouseup', function (e) {
        if (!App.$draggedCard[0]) return

        var start = App.$draggedCard.data('start'),
            movement = {
                x: Math.abs(e.pageX - start.mouse.x),
                y: Math.abs(e.pageY - start.mouse.y),
            }

        if ((movement.x || movement.y) && $('#cards').is('.sorted')) {
            var minDelta = getCardRectangle().size * 0.33
            if (movement.x > minDelta || movement.y > minDelta) {
                moveToBottom(App.$draggedCard[0])
            } else {
                App.$draggedCard.transition(start.card)
            }
        }

        App.$draggedCard = $()
    })

    function centerCards() {
        var cardRect = getCardRectangle()

        App.$cards.each(function (i, card) {
            $(card).css({
                width: cardRect.size,
                height: cardRect.size,
                top: cardRect.y,
                left: cardRect.x
            });
        })
    }

    function order() {
        var maxIndex = App.$cards.length - 1
        App.$cards.each(function (i) {
            $(this).attr('data-index', maxIndex - i)
        })
    }

    function setupFader() {
        $('<style>#cards.playing:after{z-index:' + App.$cards.length + ';}</style>').appendTo('head')
    }

    function getCardRectangle() {
        var windowWidth = $(window).width(),
            windowHeight = $(window).height(),
            cardSize = Math.min(320, windowWidth * App.SLIDE_SCALE, windowHeight * App.SLIDE_SCALE)

        return {
            size: cardSize,
            x: (windowWidth - cardSize) / 2,
            y: (windowHeight - cardSize) / 2,
        }
    }

    function rand() {
        return Math.sin(Math.random()*2*Math.PI)
    }

    function dropOne(card, distance) {
        var $card = $(card)
        $card.css({
            zIndex: $card.attr('data-index')
        }).transition({
            x: distance.x * 1.3 * rand(),
            y: distance.y * 1.3 * rand(),
            rotate: 20 * rand(),
            opacity: 1
        })
    }

    function dropAll() {
        var cardRect = getCardRectangle(),
            distance = {
                x: cardRect.x,
                y: cardRect.y,
            }

        App.$cards.finish().each(function () {
            dropOne(this, distance)
        })

        $('#cards').removeClass('sorted')
    }

    //function dropAll() {
    //    var cards = App.$cards.toArray(),
    //        cardRect = getCardRectangle(),
    //        distance = {
    //            x: cardRect.x,
    //            y: cardRect.y,
    //        },
    //        zIndex = 1
    //
    //    var intervalId = setInterval(function () {
    //        if (cards.length == 0) return clearInterval(intervalId)
    //
    //        var card = cards.pop();
    //        card.style.zIndex = zIndex++
    //        dropOne(card, distance)
    //    }, 300)
    //}

    function gatherOne(card) {
        var $card = $(card);
        $card.css({
            zIndex: $card.attr('data-index')
        }).transition({
            x: 10 * rand(),
            y: 10 * rand(),
            rotate: 5 * rand(),
        })
    }

    function gatherAll() {
        App.$cards.each(function () {
            gatherOne(this)
        })
    }

    function checkSelectedCard(card) {
        if (!card) return

        if (isOldestInPlay(card)) {
            if (!App.didMistake) addScore()
            App.didMistake = false
            App.$cards.filter('.in-play').each(function () {
                $(this).removeClass('in-play').addClass('played')
                gatherOne(this)
            })
            playRound()
        } else {
            App.didMistake = true
            showAnswer()
        }
    }

    function isOldestInPlay(card) {
        return card == getOldestCardInPlay()
    }

    function getOldestCardInPlay() {
        var $cardsInPlay = App.$cards.filter('.in-play')
        return +$cardsInPlay.first().attr('data-index') < +$cardsInPlay.last().attr('data-index') ? $cardsInPlay[0] : $cardsInPlay[1]
    }

    function startGame() {
        if (App.$cards.not('.played').length <= 1) return

        $('#cards').addClass('playing')
        App.score = 0
        $('#score .value').html(App.score)

        if (App.$cards.not('.played').length) playRound()
    }

    function finishGame() {
        order()
        gatherAll()
        App.$cards.removeClass('played')
        $('#cards').removeClass('playing').addClass('sorted')
    }

    function playRound() {
        var $cardsNotPlayed = App.$cards.not('.played')

        if ($cardsNotPlayed.length <= 1) return finishGame()

        var $cardsInPlay = $(getRandomCardsPair($cardsNotPlayed.toArray())),
            cardRect = getCardRectangle()

        $cardsInPlay.addClass('in-play').css({zIndex: App.$cards.length + 1})
        $cardsInPlay.first().transition({
            x: cardRect.size / 2,
            y: 0,
            rotate: 0,
        })
        $cardsInPlay.last().transition({
            x: -cardRect.size / 2,
            y: 0,
            rotate: 0,
        })
    }

    function getRandomCardsPair(cards) {
        var cards = cards.slice(0)
        return cards.splice(Math.floor(Math.random() * cards.length), 1).concat([cards[Math.floor(Math.random() * cards.length)]])
    }

    function showOnTop(card) {
        var zIndex = card.style.zIndex
        App.$cards.each(function () {
            if (+this.style.zIndex > zIndex) this.style.zIndex = +this.style.zIndex - 1
        })
        card.style.zIndex = App.$cards.length - 1
    }

    function moveToBottom(card) {
        var pos = $(card).css(['x', 'y']),
            cardRect = getCardRectangle()

        pos = {
            x: +parseFloat(pos.x),
            y: +parseFloat(pos.y),
        }

        $(card).transition({
            x: sign(pos.x) * (cardRect.size + 30) * Math.min(1, Math.abs(pos.x / pos.y)),
            y: sign(pos.y) * (cardRect.size + 30) * Math.min(1, Math.abs(pos.y / pos.x)),
            rotate: 0,
        }).css({
            zIndex: 0
        }).transition({
            x: 10 * rand(),
            y: 10 * rand(),
            rotate: 5 * rand(),
        }, function () {
            App.$cards.each(function () {
                if (this != card) this.style.zIndex = +this.style.zIndex + 1
            })
        })
    }

    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0
    }

    function showAnswer() {
        var cardPosition = $(getOldestCardInPlay()).position(),
            cardRect = getCardRectangle(),
            width = 100,
            height = 80

        $('#heart').css({
            color: 'white',
            top: cardPosition.top + cardRect.size / 2 - height / 2,
            left: cardPosition.left + cardRect.size / 2 - width / 2,
            width: width,
            height: height,
            opacity: 0,
            scale: 0,
        }).transition({
            opacity: 1,
            scale: 1,
        }).transition({
            opacity: 0,
            scale: 0
        })
    }

    function addScore() {
        var cardPosition = $(getOldestCardInPlay()).position(),
            cardRect = getCardRectangle(),
            width = 100,
            height = 80,
            endPosition = $('#score .symbol').offset()

        $('#heart').css({
            color: 'red',
            top: cardPosition.top + cardRect.size / 2 - height / 2,
            left: cardPosition.left + cardRect.size / 2 - width / 2,
            width: width,
            height: height,
            opacity: 0,
            scale: 0,
        }).transition({
            top: endPosition.top,
            left: endPosition.left,
            width: $('#score .symbol').width(),
            height: $('#score .symbol').height(),
            opacity: 1,
            scale: 1,
        }, function () {
            $('#score .value').html(++App.score)
        }).transition({
            opacity: 0,
            scale: 0,
        })
    }
})

window.Insta = {
    fetch: function (path, params) {
        params = Object.assign({ access_token: getAccessToken() }, params)

        return fetchJsonp('https://api.instagram.com/v1/' + path + '?' + jQuery.param(params)).then(function (response) {
            if (response.ok) return response.json()
            else throw response
        }).then(function (responseJson) {
            if (responseJson.meta.code == 200) return responseJson
            else throw responseJson
        }).catch(function (error) {
            console.log(error)
            return {}
        })
    },

    fetchMedia: function (max_id) {
        var params = {min_timestamp: App.DAY_X, count: 100}
        if (max_id) params.max_id = max_id

        return Insta.fetch('users/' + App.INSTA_JEN_ID + '/media/recent/', params)
    },
}

function login(clientId, redirectUri) {
    window.location = 'https://instagram.com/oauth/authorize/?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=token'
}

function getAccessToken() {
    return Cookies.get('insta_access_token')
}

function checkLocationHashForToken() {
    var hashToken = getLocationHashParams()['access_token']
    if (hashToken) {
        Cookies.set('insta_access_token', hashToken)
        window.location.hash = ''
    }
}

function getLocationHashParams() {
    return window.location.hash.substring(1).split('&').reduce(function (result, paramKeyValPair) {
        var keyVal = paramKeyValPair.split('=')
        result[keyVal[0]] = keyVal[1]
        return result
    }, {})
}

function fetchMediaWithAlex(max_id) {
    return Insta.fetchMedia(max_id).then(function (response) {
        var media1 = response.data.filter(isMediaWithAlex)
        return !response.pagination.next_max_id
            ? media1
            : fetchMediaWithAlex(response.pagination.next_max_id).then(function (media2) {
            return media1.concat(media2)
        })
    })
}

function isMediaWithAlex(media) {
    return media.users_in_photo && media.users_in_photo.some(function (inPhoto) {
            return inPhoto.user.id == App.INSTA_ALEX_ID
        })
}